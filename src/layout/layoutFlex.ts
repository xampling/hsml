import { measureNode } from './measure';
import { LayoutBox } from './types';
import { RoomMLNode } from '../roomml/types';

export function layoutTree(
  node: RoomMLNode,
  origin = { x: 0, y: 0, z: 0 },
  sizeOverride?: Partial<{ w: number; d: number; h: number }>
): LayoutBox {
  const natural = measureNode(node);
  const box: LayoutBox = {
    id: node.id ?? node.type,
    type: node.type,
    x: origin.x,
    y: origin.y,
    z: origin.z,
    w: sizeOverride?.w ?? natural.w,
    h: sizeOverride?.h ?? natural.h,
    d: sizeOverride?.d ?? natural.d,
    node,
    children: []
  };

  if (!node.children || node.children.length === 0) {
    return box;
  }

  const layout = node.layout ?? { mode: 'flex', dir: 'row', gap: 0 };
  if (layout.mode !== 'flex') return box;

  const layoutChildren = node.children.filter((c) =>
    ['house', 'floor', 'container', 'group', 'room', 'furniture'].includes(c.type)
  );

  const gap = layout.gap ?? 0;
  const mainIsX = layout.dir === 'row';
  const mainSize = mainIsX ? box.w : box.d;
  const crossSize = mainIsX ? box.d : box.w;

  const childInfo = layoutChildren.map((child) => {
    const naturalSize = measureNode(child);
    const main = child.flex?.basis ?? (mainIsX ? naturalSize.w : naturalSize.d);
    const cross = mainIsX ? naturalSize.d : naturalSize.w;
    const grow = child.flex?.grow ?? 0;
    const shrink = child.flex?.shrink ?? 0;
    return { child, naturalSize, main, cross, grow, shrink };
  });

  const totalMain = childInfo.reduce((sum, c) => sum + c.main, 0) + gap * Math.max(0, childInfo.length - 1);
  const leftover = mainSize - totalMain;
  const sumGrow = childInfo.reduce((sum, c) => sum + c.grow, 0);
  const sumShrink = childInfo.reduce((sum, c) => sum + c.shrink, 0);

  if (leftover > 0 && sumGrow > 0) {
    for (const info of childInfo) {
      info.main += (leftover * info.grow) / sumGrow;
    }
  } else if (leftover < 0 && sumShrink > 0) {
    for (const info of childInfo) {
      info.main += (leftover * info.shrink) / sumShrink;
      if (info.main < 0) info.main = 0;
    }
  }

  let cursor = 0;
  for (const info of childInfo) {
    const childW = mainIsX ? info.main : info.cross || crossSize;
    const childD = mainIsX ? info.cross || crossSize : info.main;
    const childOrigin = {
      x: box.x + (mainIsX ? cursor : 0),
      y: box.y,
      z: box.z + (mainIsX ? 0 : cursor)
    };

    const childBox = layoutTree(info.child, childOrigin, { w: childW, d: childD, h: info.naturalSize.h });
    box.children.push(childBox);
    cursor += info.main + gap;
  }

  return box;
}
