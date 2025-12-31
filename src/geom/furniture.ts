import * as THREE from 'three';
import { FurnitureNode, RoomNode } from '../roomml/types';
import { MaterialSet } from './materials';

export function buildFurniture(node: FurnitureNode, room: RoomNode, materials: MaterialSet): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(node.size.w, node.size.h, node.size.d);
  const mesh = new THREE.Mesh(geometry, materials.furniture);
  const pos = deriveFurniturePosition(node, room);
  mesh.position.set(
    pos.x + node.size.w / 2,
    (pos.y ?? 0) + node.size.h / 2,
    pos.z + node.size.d / 2
  );
  mesh.castShadow = true;
  return mesh;
}

export function deriveFurniturePosition(node: FurnitureNode, room: RoomNode) {
  const place = node.place ?? { mode: 'free' as const, x: 0, z: 0, y: 0 };
  if (place.mode === 'free') {
    return { x: place.x ?? 0, z: place.z ?? 0, y: place.y ?? 0 };
  }

  const inset = place.inset ?? 0;
  const offset = place.offset ?? 0;
  switch (place.anchor) {
    case 'N':
      return { x: offset, z: inset, y: place.y ?? 0 };
    case 'S':
      return { x: offset, z: room.size.d - node.size.d - inset, y: place.y ?? 0 };
    case 'W':
      return { x: inset, z: offset, y: place.y ?? 0 };
    case 'E':
      return { x: room.size.w - node.size.w - inset, z: offset, y: place.y ?? 0 };
    default:
      return { x: 0, z: 0, y: place.y ?? 0 };
  }
}
