import React, { useRef, useState, useEffect } from 'react';
import { GraphSchema, ViewportState, NodeData } from '../../types';
import { NodeWidget } from './NodeWidget';
import { ConnectionLine } from './ConnectionLine';
import { getPortPosition, calculateNodeContentSize } from '../../utils';

interface GraphCanvasProps {
  schema: GraphSchema;
  onNodesChange?: (nodes: NodeData[]) => void;
  onInteractionEnd?: () => void;
}

type InteractionMode = 'IDLE' | 'PANNING' | 'DRAGGING_NODES' | 'BOX_SELECTING' | 'RESIZING_NODE' | 'PINCH_ZOOM';

interface SelectionBox {
  startX: number; // Screen coords
  startY: number;
  currentX: number;
  currentY: number;
}

interface ResizingState {
  nodeId: string;
  handle: string; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  startBound: { x: number; y: number; width: number; height: number };
  startMouse: { x: number; y: number }; // Screen coords
}

interface PinchState {
    startDist: number;
    startScale: number;
    startCenter: { x: number; y: number }; // Screen coords
    startViewportPos: { x: number; y: number };
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ schema, onNodesChange, onInteractionEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<InteractionMode>('IDLE');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  
  // Refs for interaction state
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastMousePosRef = useRef({ x: 0, y: 0 }); // Screen coords (used for pan/drag)
  const resizingStateRef = useRef<ResizingState | null>(null);
  const dragOffsetsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<PinchState | null>(null);

  // Refs for data access in callbacks
  const viewportRef = useRef(viewport);
  const schemaRef = useRef(schema);
  
  useEffect(() => { viewportRef.current = viewport; }, [viewport]);
  useEffect(() => { schemaRef.current = schema; }, [schema]);

  // --- Helpers ---

  const screenToWorld = (sx: number, sy: number) => {
    const v = viewportRef.current;
    return {
      x: (sx - v.x) / v.scale,
      y: (sy - v.y) / v.scale
    };
  };

  const getPointerDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getPointerCenter = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  };

  // --- Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    // Capture pointer to track movements outside div if needed (standard for drag)
    containerRef.current?.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const target = e.target as HTMLElement;
    const resizeHandle = target.getAttribute('data-resize-handle');
    const clickedNodeEl = target.closest('[data-node-id]');
    const clickedNodeId = clickedNodeEl?.getAttribute('data-node-id');

    // --- CHECK MULTI-TOUCH (PINCH) ---
    if (activePointersRef.current.size === 2) {
        const points: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
        if (points[0] && points[1]) {
            const dist = getPointerDistance(points[0], points[1]);
            const center = getPointerCenter(points[0], points[1]);

            setMode('PINCH_ZOOM');
            pinchRef.current = {
                startDist: dist,
                startScale: viewportRef.current.scale,
                startViewportPos: { x: viewportRef.current.x, y: viewportRef.current.y },
                startCenter: center
            };
            // Clear other modes artifacts
            setSelectionBox(null);
            return;
        }
    }

    // --- SINGLE POINTER INTERACTION ---
    if (activePointersRef.current.size === 1) {
        // Right/Middle Click -> Mouse Pan
        if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2)) {
            e.preventDefault();
            setMode('PANNING');
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (e.button === 0) { // Primary Button (or Touch)
            
            // 1. Resizing (Priority)
            if (resizeHandle && clickedNodeId) {
                e.preventDefault();
                e.stopPropagation();
                setMode('RESIZING_NODE');
                
                const node = schemaRef.current.nodes.find(n => n.id === clickedNodeId);
                if (node) {
                    resizingStateRef.current = {
                        nodeId: clickedNodeId,
                        handle: resizeHandle,
                        startBound: { 
                            x: node.position.x, 
                            y: node.position.y, 
                            width: node.size?.width ?? 200, 
                            height: node.size?.height ?? 100 
                        },
                        startMouse: { x: e.clientX, y: e.clientY }
                    };
                }
                return;
            }

            // 2. Node Interaction
            if (clickedNodeId) {
                e.preventDefault();
                setMode('DRAGGING_NODES');
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };

                // Logic: Touch -> Simple Select & Drag. Mouse -> Standard Shift/Click Select.
                if (e.pointerType === 'touch') {
                    // Mobile: Drop selection logic, just drag the touched node.
                    // If we want to support multi-touch drag later, this might need changing, 
                    // but "drop the selection" request implies simplicity.
                    const newSelection = new Set([clickedNodeId]);
                    setSelectedNodeIds(newSelection);
                    
                    // Calc offsets
                    const worldMouse = screenToWorld(e.clientX, e.clientY);
                    const offsets = new Map();
                    const node = schemaRef.current.nodes.find(n => n.id === clickedNodeId);
                    if (node) {
                        offsets.set(node.id, { x: node.position.x - worldMouse.x, y: node.position.y - worldMouse.y });
                    }
                    dragOffsetsRef.current = offsets;

                } else {
                    // Desktop: Standard Logic
                    const newSelection = new Set(selectedNodeIds);
                    if (e.shiftKey) {
                        if (newSelection.has(clickedNodeId)) newSelection.delete(clickedNodeId);
                        else newSelection.add(clickedNodeId);
                    } else {
                        if (!newSelection.has(clickedNodeId)) {
                            newSelection.clear();
                            newSelection.add(clickedNodeId);
                        }
                    }
                    setSelectedNodeIds(newSelection);

                    const worldMouse = screenToWorld(e.clientX, e.clientY);
                    const offsets = new Map();
                    schemaRef.current.nodes.forEach(node => {
                        if (newSelection.has(node.id)) {
                            offsets.set(node.id, {
                                x: node.position.x - worldMouse.x,
                                y: node.position.y - worldMouse.y
                            });
                        }
                    });
                    dragOffsetsRef.current = offsets;
                }
                return;
            }

            // 3. Background Interaction
            e.preventDefault();
            
            if (e.pointerType === 'touch') {
                // Mobile: Pan on background
                setMode('PANNING');
            } else {
                // Desktop: Box Select
                setMode('BOX_SELECTING');
                setSelectionBox({
                    startX: e.clientX,
                    startY: e.clientY,
                    currentX: e.clientX,
                    currentY: e.clientY
                });
                if (!e.shiftKey) setSelectedNodeIds(new Set());
            }
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Update pointer tracker
    if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (mode === 'IDLE') return;
    if (e.pointerType === 'touch') e.preventDefault();

    // --- PINCH ZOOM ---
    if (mode === 'PINCH_ZOOM' && activePointersRef.current.size === 2 && pinchRef.current) {
        const points: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
        
        if (points[0] && points[1]) {
            const currDist = getPointerDistance(points[0], points[1]);
            const currCenter = getPointerCenter(points[0], points[1]);
            
            const { startDist, startScale, startViewportPos, startCenter } = pinchRef.current;
            
            // Calculate Scale
            // Limit zoom
            let newScale = startScale * (currDist / startDist);
            newScale = Math.min(Math.max(0.1, newScale), 5);

            // Calculate Position
            // We want the world point that was under startCenter to now be under currCenter
            // WorldPoint = (StartCenter - StartViewport) / StartScale
            // NewViewport = CurrCenter - (WorldPoint * NewScale)
            
            const worldPointX = (startCenter.x - startViewportPos.x) / startScale;
            const worldPointY = (startCenter.y - startViewportPos.y) / startScale;
            
            const newX = currCenter.x - (worldPointX * newScale);
            const newY = currCenter.y - (worldPointY * newScale);

            setViewport({ x: newX, y: newY, scale: newScale });
        }
        return;
    }

    // --- PANNING ---
    if (mode === 'PANNING') {
      // Find the active pointer (should be just one if we are here, or use event)
      // Since handlePointerMove fires for the moving pointer, e.clientX is correct.
      // But if we switched from Pinch to Pan, we need to be careful.
      // We rely on lastMousePosRef which we update at the end of this block.
      
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } 
    
    // --- DRAGGING NODES ---
    else if (mode === 'DRAGGING_NODES') {
      const worldMouse = screenToWorld(e.clientX, e.clientY);
      
      const updatedNodes = schemaRef.current.nodes.map(node => {
        const offset = dragOffsetsRef.current.get(node.id);
        if (offset) {
          return {
            ...node,
            position: {
              x: worldMouse.x + offset.x,
              y: worldMouse.y + offset.y
            }
          };
        }
        return node;
      });

      if (onNodesChange) {
        onNodesChange(updatedNodes);
      }
    }

    // --- RESIZING ---
    else if (mode === 'RESIZING_NODE' && resizingStateRef.current) {
        const { nodeId, handle, startBound, startMouse } = resizingStateRef.current;
        const scale = viewportRef.current.scale;
        
        const dx = (e.clientX - startMouse.x) / scale;
        const dy = (e.clientY - startMouse.y) / scale;
        
        const updatedNodes = schemaRef.current.nodes.map(node => {
            if (node.id !== nodeId) return node;

            const { width: minW, height: minH } = calculateNodeContentSize(node);

            let { x, y, width, height } = startBound;
            
            if (handle.includes('e')) width = Math.max(minW, startBound.width + dx);
            if (handle.includes('w')) {
                const desiredWidth = startBound.width - dx;
                width = Math.max(minW, desiredWidth);
                const fixedRight = startBound.x + startBound.width;
                x = fixedRight - width;
            }
            if (handle.includes('s')) height = Math.max(minH, startBound.height + dy);
            if (handle.includes('n')) {
                const desiredHeight = startBound.height - dy;
                height = Math.max(minH, desiredHeight);
                const fixedBottom = startBound.y + startBound.height;
                y = fixedBottom - height;
            }

            return { ...node, position: { x, y }, size: { width, height } };
        });
        
        if (onNodesChange) onNodesChange(updatedNodes);
    }

    // --- BOX SELECT ---
    else if (mode === 'BOX_SELECTING') {
       setSelectionBox(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null);
       
       if (selectionBox) {
           const sb = selectionBox;
           const boxLeft = Math.min(sb.startX, e.clientX);
           const boxTop = Math.min(sb.startY, e.clientY);
           const boxRight = Math.max(sb.startX, e.clientX);
           const boxBottom = Math.max(sb.startY, e.clientY);

           const currentSelection = new Set<string>();
           const v = viewportRef.current;
           schemaRef.current.nodes.forEach(node => {
               const nodeW = node.size?.width ?? 200;
               const nodeH = node.size?.height ?? 100;
               const nx = (node.position.x * v.scale) + v.x;
               const ny = (node.position.y * v.scale) + v.y;
               const nw = nodeW * v.scale;
               const nh = nodeH * v.scale;

               if (!(nx > boxRight || nx + nw < boxLeft || ny > boxBottom || ny + nh < boxTop)) {
                   currentSelection.add(node.id);
               }
           });
           setSelectedNodeIds(currentSelection);
       }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
    }

    if (mode === 'PINCH_ZOOM') {
        if (activePointersRef.current.size < 2) {
             if (activePointersRef.current.size === 1) {
                 const remaining = activePointersRef.current.values().next().value;
                 if (remaining) {
                     lastMousePosRef.current = { ...remaining };
                     setMode('PANNING');
                 } else {
                     setMode('IDLE');
                 }
             } else {
                 setMode('IDLE');
             }
        }
    } else if (activePointersRef.current.size === 0) {
        if (mode !== 'IDLE') {
            // Trigger save if we were modifying nodes
            if ((mode === 'DRAGGING_NODES' || mode === 'RESIZING_NODE') && onInteractionEnd) {
                onInteractionEnd();
            }

            setMode('IDLE');
            setSelectionBox(null);
            resizingStateRef.current = null;
        }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const currentScale = viewportRef.current.scale;
    const newScale = Math.min(Math.max(0.1, currentScale + delta), 5);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - viewportRef.current.x) / currentScale;
    const worldY = (mouseY - viewportRef.current.y) / currentScale;

    const newX = mouseX - (worldX * newScale);
    const newY = mouseY - (worldY * newScale);

    setViewport({ x: newX, y: newY, scale: newScale });
  };

  // --- Rendering ---

  const connectionLines = schema.connections.map((conn, idx) => {
    const actualSourceNode = schema.nodes.find(n => n.outputs?.some(o => o.id === conn.from));
    const actualTargetNode = schema.nodes.find(n => n.inputs?.some(i => i.id === conn.to));

    if (!actualSourceNode || !actualTargetNode) return null;

    const start = getPortPosition(actualSourceNode, conn.from, 'output');
    const end = getPortPosition(actualTargetNode, conn.to, 'input');
    
    const sourcePortDef = actualSourceNode.outputs?.find(o => o.id === conn.from);
    const targetPortDef = actualTargetNode.inputs?.find(i => i.id === conn.to);

    if (start && end && sourcePortDef && targetPortDef) {
      return (
        <ConnectionLine
          key={`${conn.from}-${conn.to}-${idx}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          sourceType={sourcePortDef.type}
          targetType={targetPortDef.type}
        />
      );
    }
    return null;
  });

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#111] overflow-hidden relative touch-none select-none outline-none
        ${mode === 'PANNING' ? 'cursor-grabbing' : ''}
        ${mode === 'DRAGGING_NODES' ? 'cursor-move' : ''}
        ${mode === 'IDLE' ? 'cursor-default' : ''}
        ${mode === 'BOX_SELECTING' ? 'cursor-crosshair' : ''}
        ${mode === 'RESIZING_NODE' ? 'cursor-nwse-resize' : ''} 
      `}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
        {/* Grid Background */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
                backgroundPosition: `${viewport.x}px ${viewport.y}px`
            }}
        />

        {/* World Transform Layer */}
        <div 
            style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
            }}
        >
            {/* 1. SVG Lines rendered FIRST to be under the nodes */}
            <svg 
                className="absolute top-0 left-0 overflow-visible pointer-events-none w-1 h-1"
            >
                {connectionLines}
            </svg>

            {/* 2. Nodes rendered on top */}
            {schema.nodes.map(node => (
                <NodeWidget 
                    key={node.id} 
                    data={node} 
                    isSelected={selectedNodeIds.has(node.id)}
                />
            ))}
        </div>

        {/* Selection Box Overlay */}
        {mode === 'BOX_SELECTING' && selectionBox && (
            <div 
                className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 rounded-lg pointer-events-none z-50"
                style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                }}
            />
        )}

        {/* HUD */}
        <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs text-neutral-400 font-mono pointer-events-none select-none z-50">
            Zoom: {Math.round(viewport.scale * 100)}% | X: {Math.round(viewport.x)} Y: {Math.round(viewport.y)} <br/>
            {selectedNodeIds.size > 0 ? `${selectedNodeIds.size} selected` : 'L-Click: Select | Wheel: Zoom | Middle/Right: Pan'}
        </div>
    </div>
  );
};