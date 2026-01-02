import { HSMLNode, Size3D } from './types';

export function measureTree(node: HSMLNode): Size3D {
  return measureNodeRecursive(node);
}

function measureNodeRecursive(node: HSMLNode): Size3D {
  const explicitW = asNumber(node.style.w);
  const explicitD = asNumber(node.style.d);
  const explicitH = asNumber(node.style.h);

  if (node.children.length === 0) {
    const size = {
      w: explicitW ?? 1,
      d: explicitD ?? 1,
      h: explicitH ?? 1
    };
    node.measured = size;
    return size;
  }

  const childSizes = node.children.map((c) => measureNodeRecursive(c));
  const gap = node.style.gap ?? 0;
  const px = node.style.padding.x ?? 0;
  const pz = node.style.padding.z ?? 0;
  const py = node.style.padding.y ?? 0;

  if (node.style.layout === 'row' || node.style.layout === 'col') {
    const mainIsX = node.style.layout === 'row';
    const sumMain = childSizes.reduce((sum, s) => sum + (mainIsX ? s.w : s.d), 0);
    const maxCross = childSizes.reduce((max, s) => Math.max(max, mainIsX ? s.d : s.w), 0);
    const maxH = childSizes.reduce((max, s) => Math.max(max, s.h), 0);

    const w =
      explicitW ??
      (mainIsX ? sumMain + gap * Math.max(0, childSizes.length - 1) + 2 * px : maxCross + 2 * px);
    const d =
      explicitD ??
      (mainIsX ? maxCross + 2 * pz : sumMain + gap * Math.max(0, childSizes.length - 1) + 2 * pz);
    const h = explicitH ?? maxH + 2 * py;
    const size = { w, d, h };
    node.measured = size;
    return size;
  }

  const maxW = childSizes.reduce((max, s) => Math.max(max, s.w), 0);
  const maxD = childSizes.reduce((max, s) => Math.max(max, s.d), 0);
  const maxH = childSizes.reduce((max, s) => Math.max(max, s.h), 0);

  const size = {
    w: explicitW ?? maxW + 2 * px,
    d: explicitD ?? maxD + 2 * pz,
    h: explicitH ?? maxH + 2 * py
  };
  node.measured = size;
  return size;
}

function asNumber(v: number | 'auto'): number | undefined {
  return typeof v === 'number' ? v : undefined;
}
