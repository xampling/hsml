import { RoomMLNode } from './types';

const counters: Record<string, number> = {};

export function resetIdCounters() {
  for (const key of Object.keys(counters)) {
    delete counters[key];
  }
}

export function ensureIds(node: RoomMLNode, path: string[] = []): RoomMLNode {
  const withId = assignId(node);
  if (withId.children) {
    withId.children = withId.children.map((child, index) =>
      ensureIds(child, [...path, withId.id ?? `${withId.type}-${index + 1}`])
    );
  }
  return withId;
}

function assignId(node: RoomMLNode): RoomMLNode {
  if (node.id) return { ...node } as RoomMLNode;
  const key = node.type;
  counters[key] = (counters[key] ?? 0) + 1;
  const id = `${key}-${counters[key]}`;
  return { ...node, id } as RoomMLNode;
}
