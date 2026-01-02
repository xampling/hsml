import * as THREE from 'three';
import { LayoutBox } from '../layout/types';
import { MaterialSet } from './materials';
import { buildWalls } from './buildWalls';

export function buildRoom(box: LayoutBox, materials: MaterialSet): THREE.Group {
  const wallT = box.node.style.t;
  const floorT = 0.08;
  const ceilingT = 0.04;

  const group = new THREE.Group();
  group.name = box.node.path || box.node.name;

  const floorGeom = new THREE.BoxGeometry(box.w, floorT, box.d);
  const floorMesh = new THREE.Mesh(floorGeom, materials.floor);
  floorMesh.position.set(box.w / 2, floorT / 2, box.d / 2);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const ceilingGeom = new THREE.BoxGeometry(box.w, ceilingT, box.d);
  const ceilingMesh = new THREE.Mesh(ceilingGeom, materials.ceiling);
  ceilingMesh.position.set(box.w / 2, box.h + ceilingT / 2, box.d / 2);
  group.add(ceilingMesh);

  const walls = buildWalls(box, wallT, materials);
  walls.position.set(0, 0, 0);
  group.add(walls);

  return group;
}
