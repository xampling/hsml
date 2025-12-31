import * as THREE from 'three';
import { DoorNode, RoomNode, WindowNode, WallSide } from '../roomml/types';
import { buildWallShape, Opening } from './wallHoles';
import { MaterialSet } from './materials';

function createWallMesh(length: number, height: number, thickness: number, openings: Opening[], material: THREE.Material) {
  const shape = buildWallShape(length, height, openings);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

export function buildWalls(room: RoomNode, materials: MaterialSet): THREE.Group {
  const wallT = room.thickness?.wall ?? 0.12;
  const group = new THREE.Group();

  const openingsByWall: Record<WallSide, Opening[]> = { N: [], E: [], S: [], W: [] };
  for (const child of room.children ?? []) {
    if (child.type === 'door' || child.type === 'window') {
      openingsByWall[child.wall].push(child as DoorNode | WindowNode);
    }
  }

  const north = createWallMesh(room.size.w, room.size.h, wallT, openingsByWall['N'], materials.wall);
  north.position.set(0, 0, 0);
  group.add(north);

  const south = createWallMesh(room.size.w, room.size.h, wallT, openingsByWall['S'], materials.wall);
  south.position.set(room.size.w, 0, room.size.d);
  south.rotation.y = Math.PI;
  group.add(south);

  const west = createWallMesh(room.size.d, room.size.h, wallT, openingsByWall['W'], materials.wall);
  west.rotation.y = Math.PI / 2;
  west.position.set(0, 0, room.size.d);
  group.add(west);

  const east = createWallMesh(room.size.d, room.size.h, wallT, openingsByWall['E'], materials.wall);
  east.rotation.y = -Math.PI / 2;
  east.position.set(room.size.w, 0, 0);
  group.add(east);

  return group;
}
