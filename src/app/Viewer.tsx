import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LayoutBox } from '../layout/types';
import { buildScene } from '../geom/buildScene';

export type ViewerProps = {
  layout: LayoutBox | null;
  wireframe: boolean;
  showLayout: boolean;
  showGrid: boolean;
  hasErrors: boolean;
  navigationMode: 'first-person' | 'orbit';
};

export default function Viewer({ layout, wireframe, showLayout, showGrid, hasErrors, navigationMode }: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<FirstPersonControls | OrbitControls | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1220');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(6, 1.8, 10);
    scene.add(camera);
    cameraRef.current = camera;

    const clock = new THREE.Clock();
    clockRef.current = clock;

    const resize = () => {
      if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      rendererRef.current.setSize(width, height, false);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', resize);

    let stop = false;
    const renderLoop = () => {
      if (stop) return;
      requestAnimationFrame(renderLoop);
      const delta = clockRef.current?.getDelta() ?? 0;
      const controls = controlsRef.current;
      if (controls) {
        if (controls instanceof FirstPersonControls) {
          controls.update(delta);
        } else {
          controls.update();
        }
      }
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      stop = true;
      window.removeEventListener('resize', resize);
      controlsRef.current?.dispose();
      clockRef.current = null;
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;

    if (!canvas || !camera) return;

    controlsRef.current?.dispose();

    if (navigationMode === 'first-person') {
      const controls = new FirstPersonControls(camera, canvas);
      controls.lookSpeed = 0.12;
      controls.movementSpeed = 6;
      controls.lookVertical = true;
      controlsRef.current = controls;
      return () => controls.dispose();
    }

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(4, 0, 4);
    controls.enableDamping = true;
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [navigationMode]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (rootGroupRef.current) {
      scene.remove(rootGroupRef.current);
      rootGroupRef.current = null;
    }

    if (!layout || hasErrors) return;

    const rootGroup = buildScene(layout, {
      wireframe,
      showLayoutBoxes: showLayout,
      showGrid,
      showAxes: showGrid
    });

    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;
  }, [layout, wireframe, showLayout, showGrid, hasErrors]);

  return <canvas ref={canvasRef} />;
}
