declare module 'three/examples/jsm/controls/FirstPersonControls.js' {
  import { Camera, EventDispatcher } from 'three';

  export class FirstPersonControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    lookSpeed: number;
    movementSpeed: number;
    lookVertical: boolean;
    activeLook: boolean;
    update(delta: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    target: Vector3;
    enableDamping: boolean;
    update(): void;
    dispose(): void;
  }
}
