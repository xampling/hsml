import { intersects } from '../utils/aabb';
import { clamp } from '../utils/math';
import {
  ContainerNode,
  DoorNode,
  FurnitureNode,
  RoomMLNode,
  RoomNode,
  ValidationIssue,
  WallSide,
  WindowNode
} from './types';

export function validateRoomML(root: RoomMLNode): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const idSet = new Set<string>();

  function push(issue: ValidationIssue) {
    issues.push(issue);
  }

  function validateNode(node: RoomMLNode, path: string[], parentRoom?: RoomNode) {
    const currentPath = [...path, node.id ?? node.type].join('/');

    if (node.id) {
      if (idSet.has(node.id)) {
        push({ level: 'error', path: currentPath, message: `Duplicate id '${node.id}'` });
      } else {
        idSet.add(node.id);
      }
    }

    switch (node.type) {
      case 'house':
      case 'floor':
      case 'container':
        validateContainer(node as ContainerNode, currentPath, push);
        break;
      case 'room':
        validateRoom(node as RoomNode, currentPath, push);
        parentRoom = node as RoomNode;
        break;
      case 'furniture':
        if (parentRoom) {
          validateFurniture(node as FurnitureNode, parentRoom, currentPath, push);
        } else {
          push({ level: 'warn', path: currentPath, message: 'Furniture not placed inside a room' });
        }
        break;
      case 'door':
      case 'window':
        if (parentRoom) {
          validateOpening(node as DoorNode | WindowNode, parentRoom, currentPath, push);
        } else {
          push({ level: 'error', path: currentPath, message: 'Opening must be inside a room' });
        }
        break;
      case 'group':
        break;
      default:
        push({ level: 'error', path: currentPath, message: `Unknown node type '${node.type}'` });
    }

    const nextParent = node.type === 'room' ? (node as RoomNode) : parentRoom;
    if (node.children) {
      for (const child of node.children) {
        validateNode(child, [...path, node.id ?? node.type], nextParent);
      }
    }

    if (node.type === 'room' && node.children) {
      validateOverlaps(node as RoomNode, currentPath, push);
    }
  }

  validateNode(root, []);
  return issues;
}

function validateContainer(node: ContainerNode, path: string, push: (i: ValidationIssue) => void) {
  if (node.size) {
    const { w, d, h } = node.size;
    if (w !== undefined && w <= 0) push(error(path, 'Container width must be positive'));
    if (d !== undefined && d <= 0) push(error(path, 'Container depth must be positive'));
    if (h !== undefined && h <= 0) push(error(path, 'Container height must be positive'));
  }
  if (node.layout && node.layout.mode !== 'flex') {
    push(error(path, `Unsupported layout mode '${node.layout.mode}'`));
  }
}

function validateRoom(node: RoomNode, path: string, push: (i: ValidationIssue) => void) {
  if (!node.size || node.size.w <= 0 || node.size.d <= 0 || node.size.h <= 0) {
    push(error(path, 'Room must have positive w, d, h'));
  }
}

function validateFurniture(
  node: FurnitureNode,
  room: RoomNode,
  path: string,
  push: (i: ValidationIssue) => void
) {
  if (node.size.w <= 0 || node.size.d <= 0 || node.size.h <= 0) {
    push(error(path, 'Furniture size must be positive'));
    return;
  }

  const pos = deriveFurniturePosition(node, room);
  if (pos) {
    const { x, z } = pos;
    if (x < 0 || x + node.size.w > room.size.w || z < 0 || z + node.size.d > room.size.d) {
      push(error(path, 'Furniture placement is out of room bounds'));
    }
  }
}

function validateOpening(
  node: DoorNode | WindowNode,
  room: RoomNode,
  path: string,
  push: (i: ValidationIssue) => void
) {
  if (node.size.w <= 0 || node.size.h <= 0) {
    push(error(path, 'Opening size must be positive'));
    return;
  }

  const wallLength = node.wall === 'N' || node.wall === 'S' ? room.size.w : room.size.d;
  const sill = node.sill ?? (node.type === 'window' ? 0.9 : 0);

  if (node.offset < 0) push(error(path, 'Opening offset must be >= 0'));
  if (node.offset + node.size.w > wallLength) push(error(path, 'Opening exceeds wall length'));
  if (sill < 0) push(error(path, 'Sill must be >= 0'));
  if (sill + node.size.h > room.size.h) push(error(path, 'Opening exceeds room height'));
}

function validateOverlaps(room: RoomNode, path: string, push: (i: ValidationIssue) => void) {
  const furn = room.children?.filter((c) => c.type === 'furniture') as FurnitureNode[] | undefined;
  if (!furn || furn.length < 2) return;

  const boxes = furn.map((f) => {
    const pos = deriveFurniturePosition(f, room) ?? { x: 0, z: 0 };
    return { x: pos.x, y: pos.y ?? 0, z: pos.z, w: f.size.w, h: f.size.h, d: f.size.d };
  });

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (intersects(boxes[i], boxes[j])) {
        push({
          level: 'warn',
          path,
          message: `Furniture '${furn[i].id}' overlaps '${furn[j].id}'`
        });
      }
    }
  }
}

function deriveFurniturePosition(furn: FurnitureNode, room: RoomNode) {
  const place = furn.place ?? { mode: 'free' as const, x: 0, z: 0, y: 0 };
  if (place.mode === 'free') {
    return { x: place.x ?? 0, z: place.z ?? 0, y: place.y ?? 0 };
  }

  const inset = place.inset ?? 0;
  const offset = place.offset ?? 0;
  switch (place.anchor) {
    case 'N':
      return { x: clamp(offset, 0, room.size.w - furn.size.w), z: inset, y: place.y ?? 0 };
    case 'S':
      return {
        x: clamp(offset, 0, room.size.w - furn.size.w),
        z: room.size.d - furn.size.d - inset,
        y: place.y ?? 0
      };
    case 'W':
      return { x: inset, z: clamp(offset, 0, room.size.d - furn.size.d), y: place.y ?? 0 };
    case 'E':
      return {
        x: room.size.w - furn.size.w - inset,
        z: clamp(offset, 0, room.size.d - furn.size.d),
        y: place.y ?? 0
      };
    default:
      return { x: 0, z: 0, y: place.y ?? 0 };
  }
}

function error(path: string, message: string): ValidationIssue {
  return { level: 'error', path, message };
}

export function wallLabel(side: WallSide): string {
  switch (side) {
    case 'N':
      return 'North';
    case 'S':
      return 'South';
    case 'E':
      return 'East';
    case 'W':
      return 'West';
  }
}
