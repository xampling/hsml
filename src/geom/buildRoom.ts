import * as THREE from 'three';
import { LayoutBox } from '../layout/types';
import { RoomNode } from '../roomml/types';
import { MaterialSet } from './materials';
import { buildWalls } from './buildWalls';
import { buildFurniture } from './furniture';

export type RoomOptions = {
  showWireframe: boolean;
};

export function buildRoom(box: LayoutBox, materials: MaterialSet): THREE.Group {
  const room = box.node as RoomNode;
  const wallT = room.thickness?.wall ?? 0.12;
  const floorT = room.thickness?.floor ?? 0.08;
  const ceilingT = room.thickness?.ceiling ?? 0.04;

  const group = new THREE.Group();
  group.name = room.id;

  const floorGeom = new THREE.BoxGeometry(room.size.w, floorT, room.size.d);
  const floorMesh = new THREE.Mesh(floorGeom, materials.floor);
  floorMesh.position.set(room.size.w / 2, floorT / 2, room.size.d / 2);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const ceilingGeom = new THREE.BoxGeometry(room.size.w, ceilingT, room.size.d);
  const ceilingMesh = new THREE.Mesh(ceilingGeom, materials.ceiling);
  ceilingMesh.position.set(room.size.w / 2, room.size.h + ceilingT / 2, room.size.d / 2);
  group.add(ceilingMesh);

  const walls = buildWalls(room, materials);
  walls.position.set(0, 0, 0);
  group.add(walls);

  for (const child of room.children ?? []) {
    if (child.type === 'furniture') {
      const mesh = buildFurniture(child, room, materials);
      group.add(mesh);
    }
  }

  group.position.set(box.x, box.y, box.z);
  group.userData.layout = box;

  return group;
}
