import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ViewportState } from '../types';

export type PortPositionMap = Map<string, { x: number; y: number }>;

export function usePortPositions(
  containerRef: React.RefObject<HTMLDivElement | null>,
  viewportRef: React.RefObject<ViewportState>,
  viewport: ViewportState
): { positions: PortPositionMap; positionsRef: React.RefObject<PortPositionMap> } {
  const [positions, setPositions] = useState<PortPositionMap>(new Map());
  const positionsRef = useRef<PortPositionMap>(new Map());
  const prevMapRef = useRef<PortPositionMap>(new Map());

  const measure = (): void => {
    const container = containerRef.current;
    if (container === null) return;

    viewportRef.current = viewport;

    const containerRect = container.getBoundingClientRect();
    const portElements = container.querySelectorAll<HTMLElement>('[data-port-id]');
    const newMap: PortPositionMap = new Map();

    portElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const portId = el.getAttribute('data-port-id') ?? '';
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const worldX = (centerX - containerRect.left - viewport.x) / viewport.scale;
      const worldY = (centerY - containerRect.top - viewport.y) / viewport.scale;

      if (portId) {
        newMap.set(portId, { x: worldX, y: worldY });
      }
    });

    let changed = newMap.size !== prevMapRef.current.size;
    if (!changed) {
      for (const [key, val] of newMap) {
        const prev = prevMapRef.current.get(key);
        if (!prev || Math.abs(prev.x - val.x) > 0.5 || Math.abs(prev.y - val.y) > 0.5) {
          changed = true;
          break;
        }
      }
    }

    prevMapRef.current = newMap;
    positionsRef.current = newMap;

    if (changed) {
      setPositions(newMap);
    }
  };

  useLayoutEffect(measure);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => { cancelAnimationFrame(id); };
  }, []);

  return { positions, positionsRef };
}
