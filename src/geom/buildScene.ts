import * as THREE from 'three';
import { LayoutBox } from '../layout/types';
import { createLayoutHelpers } from '../layout/debugLayout';
import { createDefaultMaterials } from './materials';
import { buildRoom } from './buildRoom';
import { buildHelpers } from './debugGeom';

export type SceneBuildOptions = {
  wireframe?: boolean;
  showLayoutBoxes?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
};

export function buildScene(layout: LayoutBox, options: SceneBuildOptions = {}): THREE.Group {
  const root = new THREE.Group();
  const materials = createDefaultMaterials(options.wireframe);

  root.add(buildLights());
  root.add(buildHelpers({ grid: options.showGrid, axes: options.showAxes }));

  const content = buildFromLayout(layout, materials);
  root.add(content);

  if (options.showLayoutBoxes) {
    root.add(createLayoutHelpers(layout));
  }

  return root;
}

function buildFromLayout(layout: LayoutBox, materials: ReturnType<typeof createDefaultMaterials>): THREE.Group {
  const group = new THREE.Group();
  group.position.set(layout.x, layout.y, layout.z);
  group.userData.layout = layout;

  if (layout.type === 'room') {
    return buildRoom(layout, materials);
  }

  for (const child of layout.children) {
    const childGroup = buildFromLayout(child, materials);
    group.add(childGroup);
  }

  return group;
}

function buildLights(): THREE.Group {
  const group = new THREE.Group();
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  group.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 12, 8);
  dir.castShadow = true;
  group.add(dir);

  return group;
}
