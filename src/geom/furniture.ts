import * as THREE from 'three';
import { LayoutBox } from '../layout/types';
import { MaterialSet } from './materials';

export function buildLeaf(box: LayoutBox, materials: MaterialSet): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(box.w, box.h, box.d);
  const mesh = new THREE.Mesh(geometry, materials.furniture);
  mesh.position.set(box.w / 2, box.h / 2, box.d / 2);
  mesh.castShadow = true;
  group.add(mesh);
  return group;
}
