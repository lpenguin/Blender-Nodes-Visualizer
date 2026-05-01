import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { sin, mix, color, time } from 'three/tsl';
import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu';
import { X, RotateCcw } from 'lucide-react';
import { buildTSLMaterial } from '../../tslRuntime';
import { GraphSchema } from '../../types';

interface ShaderPreviewProps {
  schema: GraphSchema | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShaderPreview: React.FC<ShaderPreviewProps> = ({ schema, isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const rendererRef = useRef<WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const defaultMatRef = useRef<MeshStandardNodeMaterial | null>(null);
  const frameRef = useRef<number>(0);
  const aliveRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    aliveRef.current = true;
    let renderer: WebGPURenderer | null = null;

    (async () => {
      try {
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 400;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 4);

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

        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const defaultMat = new MeshStandardNodeMaterial();
        defaultMat.colorNode = mix(color(0.2, 0.5, 1.0), color(1.0, 0.3, 0.1), sin(time));
        const mesh = new THREE.Mesh(geometry, defaultMat);
        scene.add(mesh);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        meshRef.current = mesh;
        defaultMatRef.current = defaultMat;
        setError(null);

        const animate = async () => {
          if (!aliveRef.current || !renderer) return;
          frameRef.current = requestAnimationFrame(animate);
          mesh.rotation.y += 0.005;
          mesh.rotation.x += 0.002;
          await renderer.render(scene, camera);
        };
        animate();
      } catch (err: any) {
        if (aliveRef.current) setError(err?.message || 'WebGPU init failed');
      }
    })();

    const onResize = () => {
      if (!renderer || !container || !cameraRef.current) return;
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

  const handleResetRotation = () => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[300px] shrink-0 bg-neutral-900 border-l border-neutral-800 z-30 flex flex-col">
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
