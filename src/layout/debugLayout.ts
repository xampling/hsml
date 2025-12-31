import * as THREE from 'three';
import { LayoutBox } from './types';

export function createLayoutHelpers(root: LayoutBox, color = 0x4ade80): THREE.Group {
  const group = new THREE.Group();
  traverse(root, (box) => {
    const helper = new THREE.Box3Helper(
      new THREE.Box3(
        new THREE.Vector3(box.x, box.y, box.z),
        new THREE.Vector3(box.x + box.w, box.y + box.h, box.z + box.d)
      ),
      new THREE.Color(color)
    );
    group.add(helper);
  });
  return group;
}

function traverse(box: LayoutBox, cb: (b: LayoutBox) => void) {
  cb(box);
  for (const child of box.children) {
    traverse(child, cb);
  }
}
