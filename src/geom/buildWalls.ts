import * as THREE from 'three';
import { LayoutBox } from '../layout/types';
import { Opening } from '../hsml/types';
import { buildWallShape } from './wallHoles';
import { MaterialSet } from './materials';

function createWallMesh(length: number, height: number, thickness: number, openings: Opening[], material: THREE.Material) {
  const shape = buildWallShape(length, height, openings);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

export function buildWalls(room: LayoutBox, wallT: number, materials: MaterialSet): THREE.Group {
  const group = new THREE.Group();

  const openingsByWall: Record<Opening['wall'], Opening[]> = { N: [], E: [], S: [], W: [] };
  for (const opening of room.node.style.openings) {
    openingsByWall[opening.wall].push(opening);
  }

  const north = createWallMesh(room.w, room.h, wallT, openingsByWall['N'], materials.wall);
  north.position.set(0, 0, 0);
  group.add(north);

  const south = createWallMesh(room.w, room.h, wallT, openingsByWall['S'], materials.wall);
  south.position.set(room.w, 0, room.d);
  south.rotation.y = Math.PI;
  group.add(south);

  const west = createWallMesh(room.d, room.h, wallT, openingsByWall['W'], materials.wall);
  west.rotation.y = Math.PI / 2;
  west.position.set(0, 0, room.d);
  group.add(west);

  const east = createWallMesh(room.d, room.h, wallT, openingsByWall['E'], materials.wall);
  east.rotation.y = -Math.PI / 2;
  east.position.set(room.w, 0, 0);
  group.add(east);

  return group;
}
