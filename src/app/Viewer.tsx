import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LayoutBox } from '../layout/types';
import { buildScene } from '../geom/buildScene';

export type ViewerProps = {
  layout: LayoutBox | null;
  wireframe: boolean;
  showLayout: boolean;
  showGrid: boolean;
  hasErrors: boolean;
};

export default function Viewer({ layout, wireframe, showLayout, showGrid, hasErrors }: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
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
    camera.position.set(6, 6, 10);
    scene.add(camera);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(4, 0, 4);
    controls.enableDamping = true;
    controlsRef.current = controls;

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
      controls.update();
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      stop = true;
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

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
