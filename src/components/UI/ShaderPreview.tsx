import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { sin, mix, color, time, normalWorld } from 'three/tsl';
import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, RotateCcw } from 'lucide-react';
import { buildTSLMaterial } from '../../tslRuntime';
import { GraphSchema } from '../../types';

function createHorizontalGrid(size: number, mainStep: number, subStep: number): THREE.LineSegments {
  const half = size / 2;
  const positions: number[] = [];
  const colors: number[] = [];
  const mainColor = new THREE.Color(0x888888);
  const subColor = new THREE.Color(0x333333);

  const addLine = (x1: number, z1: number, x2: number, z2: number, c: THREE.Color): void => {
    positions.push(x1, 0, z1, x2, 0, z2);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  };

  for (let i = -half; i <= half + 0.0001; i += subStep) {
    const isMain = Math.abs(i - Math.round(i / mainStep) * mainStep) < 0.001;
    const c = isMain ? mainColor : subColor;
    addLine(i, -half, i, half, c);
    addLine(-half, i, half, i, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true }));
}

interface ShaderPreviewProps {
  schema: GraphSchema | null;
  isOpen: boolean;
  onClose: () => void;
  width?: number;
}

export const ShaderPreview: React.FC<ShaderPreviewProps> = ({ schema, isOpen, onClose, width = 300 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const rendererRef = useRef<WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const defaultMatRef = useRef<MeshStandardNodeMaterial | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);
  const aliveRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    aliveRef.current = true;
    let renderer: WebGPURenderer | null = null;

    void (async () => {
      try {
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 400;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(-3, 3, 3);
        camera.lookAt(0, 0, 0);

        renderer = new WebGPURenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        await renderer.init();

        if (!aliveRef.current) {
          renderer.dispose();
          return;
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(5, 5, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5);
        fillLight.position.set(-3, 2, -5);
        scene.add(fillLight);

        // Pure TSL procedural environment — sky/ground gradient for PBR specular + diffuse
        const skyColor = color(0x80aaff);
        const groundColor = color(0x221a15);
        const blendFactor = normalWorld.y.add(1.0).mul(0.5);
        scene.environmentNode = mix(groundColor, skyColor, blendFactor);

        const grid = createHorizontalGrid(10, 1.0, 0.2);
        scene.add(grid);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const defaultMat = new MeshStandardNodeMaterial();
        defaultMat.colorNode = mix(color(0.2, 0.5, 1.0), color(1.0, 0.3, 0.1), sin(time));
        const mesh = new THREE.Mesh(geometry, defaultMat);
        scene.add(mesh);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = false;

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        meshRef.current = mesh;
        defaultMatRef.current = defaultMat;
        controlsRef.current = controls;
        setError(null);

        const animate = (): void => {
          if (!aliveRef.current || !renderer) return;
          frameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
      } catch (err: unknown) {
        if (aliveRef.current) setError((err as Error).message || 'WebGPU init failed');
      }
    })();

    const onResize = (): void => {
      if (renderer === null || cameraRef.current === null) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(container);

    return () => {
      aliveRef.current = false;
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      controlsRef.current?.dispose();
      controlsRef.current = null;
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
      defaultMatRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (schema) {
      const material = buildTSLMaterial(schema);
      if (material) {
        mesh.material = material;
        return;
      }
    }

    if (defaultMatRef.current) {
      mesh.material = defaultMatRef.current;
    }
  }, [schema]);

  const handleResetRotation = (): void => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ width }} className="shrink-0 bg-neutral-900 border-l border-neutral-800 z-30 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-neutral-800/60 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-neutral-200">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleResetRotation}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Reset rotation"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative min-h-0" />
      {error && (
        <div className="p-2 text-red-400 text-xs bg-red-900/20 border-t border-red-800/40">
          {error}
        </div>
      )}
    </div>
  );
};
