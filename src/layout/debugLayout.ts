import * as THREE from 'three';
import { LayoutBox } from './types';

export function createLayoutHelpers(root: LayoutBox, color = 0x4ade80): THREE.Group {
  const group = new THREE.Group();
  traverse(root, { x: 0, y: 0, z: 0 }, (box, offset) => {
    const absMin = new THREE.Vector3(offset.x + box.x, offset.y + box.y, offset.z + box.z);
    const absMax = new THREE.Vector3(absMin.x + box.w, absMin.y + box.h, absMin.z + box.d);
    const helper = new THREE.Box3Helper(new THREE.Box3(absMin, absMax), new THREE.Color(color));
    group.add(helper);
  });
  return group;
}

function traverse(
  box: LayoutBox,
  offset: { x: number; y: number; z: number },
  cb: (b: LayoutBox, offset: { x: number; y: number; z: number }) => void
) {
  cb(box, offset);
  const nextOffset = {
    x: offset.x + box.x,
    y: offset.y + box.y,
    z: offset.z + box.z
  };
  for (const child of box.children) {
    traverse(child, nextOffset, cb);
  }
}
