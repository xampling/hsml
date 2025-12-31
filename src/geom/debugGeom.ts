import * as THREE from 'three';

export function buildHelpers(options: {
  grid?: boolean;
  axes?: boolean;
}): THREE.Group {
  const group = new THREE.Group();
  if (options.grid) {
    const grid = new THREE.GridHelper(40, 40, 0x334155, 0x1f2937);
    grid.position.set(0, 0, 0);
    group.add(grid);
  }
  if (options.axes) {
    const axes = new THREE.AxesHelper(2);
    group.add(axes);
  }
  return group;
}
