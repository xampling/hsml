import { HSMLNode, ValidationIssue } from './types';

export function validateHSML(root: HSMLNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  walk(root, (node) => validateNode(node, issues));
  return issues;
}

function walk(node: HSMLNode, fn: (n: HSMLNode) => void) {
  fn(node);
  for (const child of node.children) {
    walk(child, fn);
  }
}

function validateNode(node: HSMLNode, issues: ValidationIssue[]) {
  const size = node.measured;
  if (!size || !isFinite(size.w) || !isFinite(size.d) || !isFinite(size.h)) {
    issues.push(issue('error', node.path, 'Resolved dimensions are invalid'));
  } else {
    if (size.w <= 0) issues.push(issue('error', node.path, 'Width must be > 0'));
    if (size.d <= 0) issues.push(issue('error', node.path, 'Depth must be > 0'));
    if (size.h <= 0) issues.push(issue('error', node.path, 'Height must be > 0'));
  }

  if (node.style.layout && node.style.layout !== 'row' && node.style.layout !== 'col') {
    issues.push(issue('error', node.path, `Invalid layout '${node.style.layout}'`));
  }

  ensureFinite(node.style.gap, node, issues, 'gap');
  ensureFinite(node.style.padding.x, node, issues, 'padding');
  ensureFinite(node.style.padding.y, node, issues, 'padding');
  ensureFinite(node.style.padding.z, node, issues, 'padding');
  ensureFinite(node.style.t, node, issues, 'wall thickness');
  ensureFinite(node.style.basis, node, issues, 'basis');
  ensureFinite(node.style.grow, node, issues, 'grow');
  ensureFinite(node.style.shrink, node, issues, 'shrink');

  if (node.kind === 'room') {
    validateOpenings(node, issues);
  }

  if (node.style.layout === 'row' || node.style.layout === 'col') {
    validateOverflow(node, issues);
  }
}

function validateOpenings(node: HSMLNode, issues: ValidationIssue[]) {
  const size = node.measured!;
  for (const opening of node.style.openings) {
    const wallLength = opening.wall === 'N' || opening.wall === 'S' ? size.w : size.d;
    if (opening.offset < 0) issues.push(issue('error', node.path, 'Opening offset must be >= 0'));
    if (opening.offset + opening.w > wallLength)
      issues.push(issue('error', node.path, 'Opening exceeds wall length'));
    if (opening.sill < 0) issues.push(issue('error', node.path, 'Sill must be >= 0'));
    if (opening.sill + opening.h > size.h)
      issues.push(issue('error', node.path, 'Opening exceeds room height'));
  }
}

function validateOverflow(node: HSMLNode, issues: ValidationIssue[]) {
  const size = node.measured!;
  const mainIsX = node.style.layout === 'row';
  const gap = node.style.gap ?? 0;
  const contentMain = (mainIsX ? size.w - 2 * node.style.padding.x : size.d - 2 * node.style.padding.z) || 0;

  const children = node.children;
  if (children.length === 0) return;

  const sumMain =
    children.reduce(
      (sum, child) => sum + (mainIsX ? child.measured!.w : child.measured!.d),
      0
    ) + gap * Math.max(0, children.length - 1);

  if (sumMain > contentMain + 1e-6) {
    const overflow = sumMain - contentMain;
    const shrinkTotal = children.reduce((sum, child) => sum + (child.style.shrink ?? 0), 0);
    if (shrinkTotal === 0) {
      issues.push(
        issue(
          'warn',
          node.path,
          `Children overflow main axis by ${overflow.toFixed(3)}m (no shrink behavior)`
        )
      );
    }
  }
}

function issue(level: ValidationIssue['level'], path: string, message: string): ValidationIssue {
  return { level, path, message };
}

function ensureFinite(
  value: number | undefined,
  node: HSMLNode,
  issues: ValidationIssue[],
  label: string
) {
  if (value === undefined) return;
  if (!isFinite(value)) {
    issues.push(issue('error', node.path, `${label} must be a finite number`));
  }
}
