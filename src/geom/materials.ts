import * as THREE from 'three';

export type MaterialSet = {
  floor: THREE.Material;
  ceiling: THREE.Material;
  wall: THREE.Material;
  furniture: THREE.Material;
};

export function createDefaultMaterials(wireframe = false): MaterialSet {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.1, roughness: 0.7, wireframe }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.1, roughness: 0.7, wireframe }),
    wall: new THREE.MeshStandardMaterial({ color: 0x14b8a6, metalness: 0.05, roughness: 0.8, wireframe }),
    furniture: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.2, roughness: 0.5, wireframe })
  };
}
