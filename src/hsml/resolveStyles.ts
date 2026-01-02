import { StyleMap, StyleRule, StyleValue } from './parseHSML';
import { HSMLNode, HSMLNodeDraft, Opening, ResolvedStyle } from './types';

export function resolveStyles(root: HSMLNodeDraft, rules: StyleRule[]): HSMLNode {
  return resolveNode(root, rules, []);
}

function resolveNode(node: HSMLNodeDraft, rules: StyleRule[], ancestors: string[]): HSMLNode {
  const mergedStyle = computeMergedStyle(node, rules, ancestors);
  const openings = decodeOpenings(mergedStyle['open']);

  const declaredKind = stringVal(mergedStyle['kind']);
  const kind = inferKind(node.name, declaredKind, openings, node.children.length > 0);

  const padding = getPadding(mergedStyle);
  const margin = getMargin(mergedStyle);

  const style: ResolvedStyle = {
    w: numericOrAuto(mergedStyle['w']),
    d: numericOrAuto(mergedStyle['d']),
    h: numericOrAuto(mergedStyle['h']),
    layout: layoutVal(mergedStyle['layout']),
    gap: numberVal(mergedStyle['gap']) ?? 0,
    padding,
    margin,
    basis: numberVal(mergedStyle['basis']),
    grow: numberVal(mergedStyle['grow']),
    shrink: numberVal(mergedStyle['shrink']),
    t: numberVal(mergedStyle['t']) ?? (kind === 'room' ? 0.12 : 0),
    openings,
    raw: mergedStyle,
    declaredKind
  };

  const resolvedChildren = node.children.map((child) => resolveNode(child, rules, [...ancestors, node.name]));

  return {
    name: node.name,
    path: node.path,
    children: resolvedChildren,
    content: node.content,
    style,
    kind
  };
}

function computeMergedStyle(node: HSMLNodeDraft, rules: StyleRule[], ancestors: string[]): StyleMap {
  const merged: StyleMap = {};

  applyRules(merged, rules, (rule) => rule.selector.kind === 'name' && rule.selector.a === node.name);
  applyRules(merged, rules, (rule) => rule.selector.kind === 'path' && rule.selector.a === node.path);
  applyRules(
    merged,
    rules,
    (rule) =>
      rule.selector.kind === 'desc' &&
      ancestors.includes(rule.selector.a) &&
      rule.selector.b === node.name
  );

  Object.assign(merged, node.inlineStyle);
  return merged;
}

function applyRules(merged: StyleMap, rules: StyleRule[], predicate: (r: StyleRule) => boolean) {
  for (const rule of rules) {
    if (predicate(rule)) {
      Object.assign(merged, rule.style);
    }
  }
}

function numericOrAuto(v: StyleValue | undefined): number | 'auto' {
  const num = numberVal(v);
  if (typeof num === 'number') return num;
  return 'auto';
}

function numberVal(v: StyleValue | undefined): number | undefined {
  if (typeof v === 'number') return v;
  return undefined;
}

function stringVal(v: StyleValue | undefined): string | undefined {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'kind' in v && (v as any).kind === 'ident') {
    return (v as any).value as string;
  }
  return undefined;
}

function layoutVal(v: StyleValue | undefined): 'row' | 'col' | undefined {
  const s = stringVal(v);
  if (s === 'row' || s === 'col') return s;
  return undefined;
}

function getPadding(style: StyleMap): { x: number; y: number; z: number } {
  const p = numberVal(style['p']) ?? 0;
  const px = numberVal(style['px']) ?? p;
  const pz = numberVal(style['pz']) ?? p;
  const py = numberVal(style['py']) ?? 0;
  return { x: px, y: py, z: pz };
}

function getMargin(style: StyleMap): { x: number; y: number; z: number } {
  const m = numberVal(style['m']) ?? 0;
  const mx = numberVal(style['mx']) ?? m;
  const mz = numberVal(style['mz']) ?? m;
  const my = numberVal(style['my']) ?? 0;
  return { x: mx, y: my, z: mz };
}

function inferKind(name: string, declaredKind: string | undefined, openings: Opening[], hasChildren: boolean) {
  if (declaredKind === 'room') return 'room';
  if (name === 'Room' || name.endsWith('Room')) return 'room';
  if (openings.length > 0) return 'room';
  return hasChildren ? 'container' : 'leaf';
}

function decodeOpenings(value: StyleValue | undefined): Opening[] {
  if (!value) return [];
  if (typeof value !== 'object' || (value as any).kind !== 'list') return [];
  const list = value as Extract<StyleValue, { kind: 'list' }>;
  const openings: Opening[] = [];

  for (const item of list.items) {
    if (typeof item !== 'object' || (item as any).kind !== 'call') continue;
    const call = item as Extract<StyleValue, { kind: 'call'; name: string; args: (number | string | { kind: 'ident'; value: string })[] }>;
    if (call.name !== 'door' && call.name !== 'window') continue;
    const wall = argIdent(call.args[0]);
    const offset = argNumber(call.args[1]);
    const width = argNumber(call.args[2]);
    const height = argNumber(call.args[3]);
    const sill = call.name === 'window' ? argNumber(call.args[4], 0.9) : 0;
    if (!wall || offset === undefined || width === undefined || height === undefined) continue;
    if (!['N', 'E', 'S', 'W'].includes(wall)) continue;
    openings.push({
      kind: call.name,
      wall: wall as Opening['wall'],
      offset,
      w: width,
      h: height,
      sill
    });
  }

  return openings;
}

function argIdent(v: number | string | { kind: 'ident'; value: string } | undefined): string | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'kind' in v && v.kind === 'ident') return v.value;
  return undefined;
}

function argNumber(v: number | string | { kind: 'ident'; value: string } | undefined, fallback: number): number;
function argNumber(v: number | string | { kind: 'ident'; value: string } | undefined, fallback?: number): number | undefined;
function argNumber(v: number | string | { kind: 'ident'; value: string } | undefined, fallback?: number): number | undefined {
  if (typeof v === 'number') return v;
  if (fallback !== undefined) return fallback;
  return undefined;
}
