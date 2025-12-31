import { RoomMLNode } from '../roomml/types';

export type Size3D = { w: number; d: number; h: number };

export function measureNode(node: RoomMLNode): Size3D {
  switch (node.type) {
    case 'room':
    case 'furniture':
      return { ...node.size };
    case 'door':
    case 'window':
      return { w: 0, d: 0, h: 0 };
    case 'group':
    case 'house':
    case 'floor':
    case 'container':
      return measureContainer(node);
    default:
      return { w: 0, d: 0, h: 0 };
  }
}

function measureContainer(node: RoomMLNode & { children?: RoomMLNode[] }): Size3D {
  const layout = node.layout ?? { mode: 'flex', dir: 'row', gap: 0 };
  const gap = layout.gap ?? 0;
  const layoutChildren = (node.children ?? []).filter((c) =>
    ['house', 'floor', 'container', 'group', 'room', 'furniture'].includes(c.type)
  );

  const childSizes = layoutChildren.map((c) => measureNode(c));
  const count = childSizes.length;

  const sumMain = childSizes.reduce((acc, s) => acc + (layout.dir === 'row' ? s.w : s.d), 0);
  const maxCross = childSizes.reduce((acc, s) => Math.max(acc, layout.dir === 'row' ? s.d : s.w), 0);
  const maxHeight = childSizes.reduce((acc, s) => Math.max(acc, s.h), 0);

  const naturalW = layout.dir === 'row' ? sumMain + gap * Math.max(0, count - 1) : maxCross;
  const naturalD = layout.dir === 'row' ? maxCross : sumMain + gap * Math.max(0, count - 1);

  return {
    w: node.size?.w ?? naturalW,
    d: node.size?.d ?? naturalD,
    h: node.size?.h ?? maxHeight
  };
}
