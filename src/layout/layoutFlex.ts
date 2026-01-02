import { HSMLNode } from '../hsml/types';
import { LayoutBox } from './types';

export function layoutTree(
  node: HSMLNode,
  origin = { x: 0, y: 0, z: 0 },
  sizeOverride?: Partial<{ w: number; d: number; h: number }>
): LayoutBox {
  const measured = node.measured ?? { w: 0, d: 0, h: 0 };
  const box: LayoutBox = {
    id: node.path || node.name,
    type: node.kind,
    x: origin.x,
    y: origin.y,
    z: origin.z,
    w: sizeOverride?.w ?? measured.w,
    h: sizeOverride?.h ?? measured.h,
    d: sizeOverride?.d ?? measured.d,
    node,
    children: []
  };

  if (!node.children || node.children.length === 0) {
    return box;
  }

  const layout = node.style.layout;
  if (layout !== 'row' && layout !== 'col') {
    for (const child of node.children) {
      const childBox = layoutTree(child, { x: node.style.padding.x, y: node.style.padding.y, z: node.style.padding.z });
      box.children.push(childBox);
    }
    return box;
  }

  const gap = node.style.gap ?? 0;
  const mainIsX = layout === 'row';
  const contentW = measured.w - 2 * node.style.padding.x;
  const contentD = measured.d - 2 * node.style.padding.z;
  const mainSize = mainIsX ? contentW : contentD;

  const childInfo = node.children.map((child) => {
    const naturalSize = child.measured!;
    const main = child.style.basis ?? (mainIsX ? naturalSize.w : naturalSize.d);
    const cross = mainIsX ? naturalSize.d : naturalSize.w;
    const grow = child.style.grow ?? 0;
    return { child, naturalSize, main, cross, grow };
  });

  const totalMain = childInfo.reduce((sum, c) => sum + c.main, 0) + gap * Math.max(0, childInfo.length - 1);
  const leftover = mainSize - totalMain;
  const sumGrow = childInfo.reduce((sum, c) => sum + c.grow, 0);

  if (leftover > 0 && sumGrow > 0) {
    for (const info of childInfo) {
      info.main += (leftover * info.grow) / sumGrow;
    }
  }

  let cursor = 0;
  for (const info of childInfo) {
    const childW = mainIsX ? info.main : info.cross;
    const childD = mainIsX ? info.cross : info.main;
    const childOrigin = {
      x: node.style.padding.x + (mainIsX ? cursor : 0),
      y: node.style.padding.y,
      z: node.style.padding.z + (mainIsX ? 0 : cursor)
    };

    const childBox = layoutTree(info.child, childOrigin, { w: childW, d: childD, h: info.naturalSize.h });
    box.children.push(childBox);
    cursor += info.main + gap;
  }

  return box;
}
