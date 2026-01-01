declare module 'three/examples/jsm/controls/FirstPersonControls' {
  import { Camera, EventDispatcher } from 'three';

  export default class FirstPersonControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    lookSpeed: number;
    movementSpeed: number;
    lookVertical: boolean;
    update(delta: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three';

  export default class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    target: Vector3;
    enableDamping: boolean;
    update(): void;
    dispose(): void;
  }
}
