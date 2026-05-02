import React, { useRef, useState, useEffect } from 'react';
import { GraphSchema, ViewportState, NodeData, ConnectionData, DataType } from '../../types';
import { NodeWidget } from './NodeWidget';
import { ConnectionLine } from './ConnectionLine';
import { calculateNodeContentSize } from '../../utils';
import { usePortPositions } from '../../hooks/usePortPositions';
import { TSLValue } from '../../handlers';

interface GraphCanvasProps {
  schema: GraphSchema;
  onNodesChange?: (nodes: NodeData[]) => void;
  onConnectionsChange?: (connections: ConnectionData[]) => void;
  onInteractionEnd?: (schema?: GraphSchema) => void;
  onDeleteNodes?: (nodeIds: string[]) => void;
  onContextMenu?: (screenPos: { x: number; y: number }, worldPos: { x: number; y: number }) => void;
}

type InteractionMode = 'IDLE' | 'PANNING' | 'DRAGGING_NODES' | 'BOX_SELECTING' | 'RESIZING_NODE' | 'PINCH_ZOOM' | 'DRAGGING_CONNECTION';

type PortDirection = 'input' | 'output';

interface PortMeta {
  portId: string;
  direction: PortDirection;
  type: DataType;
}

interface ConnectionDragState {
  anchorPortId: string;
  anchorDirection: PortDirection;
  anchorType: DataType;
  anchorPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  hoveredPortId: string | null;
  hoveredPortValid: boolean;
  detachedConnection: ConnectionData | null;
  startedFromPortId: string;
}

interface SelectionBox {
  startX: number; // Container-relative coords
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

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  schema,
  onNodesChange,
  onConnectionsChange,
  onInteractionEnd,
  onDeleteNodes,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<InteractionMode>('IDLE');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  
  // Refs for interaction state
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastMousePosRef = useRef({ x: 0, y: 0 }); // Screen coords (used for pan/drag)
  const resizingStateRef = useRef<ResizingState | null>(null);
  const dragOffsetsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<PinchState | null>(null);
  const rightClickStartRef = useRef<{ x: number; y: number } | null>(null);
  const rightClickMovedRef = useRef(false);

  // Refs for data access in callbacks
  const viewportRef = useRef<ViewportState>(viewport);
  const schemaRef = useRef<GraphSchema>(schema);

  const { positions: portPositions, positionsRef: portPositionsRef } = usePortPositions(containerRef, viewportRef, viewport);

  useEffect(() => { schemaRef.current = schema; }, [schema]);

  // --- Helpers ---

  const screenToWorld = (sx: number, sy: number): { x: number; y: number } => {
    const v = viewportRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      x: (sx - (rect?.left ?? 0) - v.x) / v.scale,
      y: (sy - (rect?.top ?? 0) - v.y) / v.scale
    };
  };

  const screenToContainer = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  const getPointerDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}): number => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getPointerCenter = (p1: {x:number, y:number}, p2: {x:number, y:number}): { x: number; y: number } => {
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  };

  const getPortMetaFromElement = (element: Element | null): PortMeta | null => {
    const portElement = element instanceof HTMLElement ? element.closest<HTMLElement>('[data-port-id]') : null;
    const portId = portElement?.getAttribute('data-port-id');
    const direction = portElement?.getAttribute('data-port-direction');
    const type = portElement?.getAttribute('data-port-type') as DataType | null;

    if (!portId || !type || (direction !== 'input' && direction !== 'output')) {
      return null;
    }

    return { portId, direction, type };
  };

  const getHoveredPort = (clientX: number, clientY: number): PortMeta | null => {
    const local = screenToContainer(clientX, clientY);
    const portAtPointer = getPortAtPointer(local.x, local.y);
    if (portAtPointer) return portAtPointer;
    if (typeof document === 'undefined') return null;
    return getPortMetaFromElement(document.elementFromPoint(clientX, clientY));
  };

  const getPortById = (portId: string, direction: PortDirection): PortMeta | null => {
    for (const node of schemaRef.current.nodes) {
      const ports = direction === 'output' ? node.outputs : node.inputs;
      const port = ports?.find((candidate) => candidate.id === portId);
      if (port) {
        return {
          portId,
          direction,
          type: port.type,
        };
      }
    }

    return null;
  };

  const getPortAtPointer = (clientX: number, clientY: number): PortMeta | null => {
    const viewportState = viewportRef.current;
    const hitRadius = Math.max(10, viewportState.scale * 12);
    let closestPort: { meta: PortMeta; distance: number } | null = null;

    const measuredPositions = portPositionsRef.current;

    for (const node of schemaRef.current.nodes) {
      for (const output of node.outputs ?? []) {
        const position = measuredPositions.get(output.id);
        if (!position) continue;

        const screenX = (position.x * viewportState.scale) + viewportState.x;
        const screenY = (position.y * viewportState.scale) + viewportState.y;
        const distance = Math.hypot(screenX - clientX, screenY - clientY);

        if (distance <= hitRadius && (!closestPort || distance < closestPort.distance)) {
          closestPort = {
            meta: { portId: output.id, direction: 'output', type: output.type },
            distance,
          };
        }
      }

      for (const input of node.inputs ?? []) {
        const position = measuredPositions.get(input.id);
        if (!position) continue;

        const screenX = (position.x * viewportState.scale) + viewportState.x;
        const screenY = (position.y * viewportState.scale) + viewportState.y;
        const distance = Math.hypot(screenX - clientX, screenY - clientY);

        if (distance <= hitRadius && (!closestPort || distance < closestPort.distance)) {
          closestPort = {
            meta: { portId: input.id, direction: 'input', type: input.type },
            distance,
          };
        }
      }
    }

    return closestPort?.meta ?? null;
  };

  const getPortAnchorPosition = (portId: string, _direction: PortDirection): { x: number; y: number } | null => {
    return portPositionsRef.current.get(portId) ?? null;
  };

  const isConnectionTargetValid = (dragState: ConnectionDragState, port: PortMeta | null): port is PortMeta => {
    return !!port && port.direction !== dragState.anchorDirection && port.portId !== dragState.anchorPortId;
  };

  const buildConnectionsForDrop = (dragState: ConnectionDragState, targetPort: PortMeta): { from: string; to: string }[] => {
    const nextConnection = dragState.anchorDirection === 'output'
      ? { from: dragState.anchorPortId, to: targetPort.portId }
      : { from: targetPort.portId, to: dragState.anchorPortId };

    const connections = schemaRef.current.connections.filter((connection) => {
      if (connection.to === nextConnection.to) return false;
      if (dragState.detachedConnection) {
        return connection.from !== dragState.detachedConnection.from || connection.to !== dragState.detachedConnection.to;
      }
      return true;
    });

    return [...connections, nextConnection];
  };

  const createConnectionDragState = (port: PortMeta, clientX: number, clientY: number): ConnectionDragState | null => {
    const currentPos = screenToWorld(clientX, clientY);

    if (port.direction === 'input') {
      const detachedConnection = schemaRef.current.connections.find((connection) => connection.to === port.portId) ?? null;

      if (detachedConnection) {
        const sourcePort = getPortById(detachedConnection.from, 'output');
        const anchorPos = sourcePort ? getPortAnchorPosition(sourcePort.portId, 'output') : null;

        if (sourcePort && anchorPos) {
          return {
            anchorPortId: sourcePort.portId,
            anchorDirection: 'output',
            anchorType: sourcePort.type,
            anchorPos,
            currentPos,
            hoveredPortId: null,
            hoveredPortValid: false,
            detachedConnection,
            startedFromPortId: port.portId,
          };
        }
      }
    }

    const anchorPos = getPortAnchorPosition(port.portId, port.direction);
    if (!anchorPos) return null;

    return {
      anchorPortId: port.portId,
      anchorDirection: port.direction,
      anchorType: port.type,
      anchorPos,
      currentPos,
      hoveredPortId: null,
      hoveredPortValid: false,
      detachedConnection: null,
      startedFromPortId: port.portId,
    };
  };

  const handleInputValueChange = (nodeId: string, portId: string, value: TSLValue): void => {
    const updatedNodes = schemaRef.current.nodes.map((node) => {
      if (node.id !== nodeId) return node;

      return {
        ...node,
        inputs: node.inputs?.map((port) => (
          port.id === portId ? { ...port, value } : port
        )),
      };
    });

    const updatedSchema = { ...schemaRef.current, nodes: updatedNodes };
    if (onNodesChange) onNodesChange(updatedNodes);
    if (onInteractionEnd) onInteractionEnd(updatedSchema);
  };

  // --- Handlers ---

  const handlePointerDown = (e: React.PointerEvent): void => {
    containerRef.current?.focus();
    // Capture pointer to track movements outside div if needed (standard for drag)
    containerRef.current?.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const target = e.target as HTMLElement;
    const resizeHandle = target.getAttribute('data-resize-handle');
    const clickedNodeEl = target.closest('[data-node-id]');
    const clickedNodeId = clickedNodeEl?.getAttribute('data-node-id');
    const local = screenToContainer(e.clientX, e.clientY);
    const clickedPort = getPortAtPointer(local.x, local.y) ?? getPortMetaFromElement(target);

    // --- CHECK MULTI-TOUCH (PINCH) ---
    if (activePointersRef.current.size === 2) {
        const points: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
        {
            const containerPoints = points.map(p => screenToContainer(p.x, p.y));
            const dist = getPointerDistance(containerPoints[0], containerPoints[1]);
            const center = getPointerCenter(containerPoints[0], containerPoints[1]);

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
            if (e.button === 2) {
                rightClickStartRef.current = { x: e.clientX, y: e.clientY };
                rightClickMovedRef.current = false;
            }
            setMode('PANNING');
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (e.button === 0) { // Primary Button (or Touch)
            
            // 1. Connection Dragging
            if (clickedPort) {
                const dragState = createConnectionDragState(clickedPort, e.clientX, e.clientY);
                if (!dragState) return;

                e.preventDefault();
                e.stopPropagation();
                setMode('DRAGGING_CONNECTION');
                setSelectionBox(null);
                setConnectionDrag(dragState);
                return;
            }

            // 2. Resizing
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

            // 3. Node Interaction
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
                    const offsets = new Map<string, { x: number; y: number }>();
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
                    const offsets = new Map<string, { x: number; y: number }>();
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

            // 4. Background Interaction
            e.preventDefault();
            
            if (e.pointerType === 'touch') {
                // Mobile: Pan on background
                setMode('PANNING');
            } else {
                // Desktop: Box Select
                const local = screenToContainer(e.clientX, e.clientY);
                setMode('BOX_SELECTING');
                setSelectionBox({
                    startX: local.x,
                    startY: local.y,
                    currentX: local.x,
                    currentY: local.y
                });
                if (!e.shiftKey) setSelectedNodeIds(new Set());
            }
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent): void => {
    // Update pointer tracker
    if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (mode === 'IDLE') return;
    if (e.pointerType === 'touch') e.preventDefault();

    // --- PINCH ZOOM ---
    if (mode === 'PINCH_ZOOM' && activePointersRef.current.size === 2 && pinchRef.current) {
        const points: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
        
        {
            const containerPoints = points.map(p => screenToContainer(p.x, p.y));
            const currDist = getPointerDistance(containerPoints[0], containerPoints[1]);
            const currCenter = getPointerCenter(containerPoints[0], containerPoints[1]);
            
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

    // --- DRAGGING CONNECTION ---
    if (mode === 'DRAGGING_CONNECTION' && connectionDrag) {
      const hoveredPort = getHoveredPort(e.clientX, e.clientY);
      const hoveredPortValid = isConnectionTargetValid(connectionDrag, hoveredPort);

      setConnectionDrag({
        ...connectionDrag,
        currentPos: screenToWorld(e.clientX, e.clientY),
        hoveredPortId: hoveredPort?.portId ?? null,
        hoveredPortValid,
      });
      return;
    }

    // --- PANNING ---
    if (mode === 'PANNING') {
      if (rightClickStartRef.current && !rightClickMovedRef.current) {
        const dist = Math.hypot(e.clientX - rightClickStartRef.current.x, e.clientY - rightClickStartRef.current.y);
        if (dist > 5) {
          rightClickMovedRef.current = true;
        }
      }

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
       const local = screenToContainer(e.clientX, e.clientY);
       setSelectionBox(prev => prev ? ({ ...prev, currentX: local.x, currentY: local.y }) : null);
       
       if (selectionBox) {
           const sb = selectionBox;
           const boxLeft = Math.min(sb.startX, local.x);
           const boxTop = Math.min(sb.startY, local.y);
           const boxRight = Math.max(sb.startX, local.x);
           const boxBottom = Math.max(sb.startY, local.y);

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

  const handlePointerUp = (e: React.PointerEvent): void => {
    activePointersRef.current.delete(e.pointerId);
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
    }

    if (mode === 'DRAGGING_CONNECTION' && connectionDrag && activePointersRef.current.size === 0) {
        const hoveredPort = getHoveredPort(e.clientX, e.clientY);
        const hoveredPortValid = isConnectionTargetValid(connectionDrag, hoveredPort);

        if (hoveredPortValid && onConnectionsChange) {
            const updatedConnections = buildConnectionsForDrop(connectionDrag, hoveredPort);
            const updatedSchema = { ...schemaRef.current, connections: updatedConnections };
            onConnectionsChange(updatedConnections);
            if (onInteractionEnd) onInteractionEnd(updatedSchema);
        } else if (connectionDrag.detachedConnection && onConnectionsChange) {
            const detached = connectionDrag.detachedConnection;
            const updatedConnections = schemaRef.current.connections.filter(
                (connection) => connection.from !== detached.from || connection.to !== detached.to
            );
            const updatedSchema = { ...schemaRef.current, connections: updatedConnections };
            onConnectionsChange(updatedConnections);
            if (onInteractionEnd) onInteractionEnd(updatedSchema);
        }

        setConnectionDrag(null);
        setMode('IDLE');
        return;
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
        if (mode === 'PANNING' && rightClickStartRef.current && !rightClickMovedRef.current) {
            const screenPos = { x: rightClickStartRef.current.x, y: rightClickStartRef.current.y };
            const worldPos = screenToWorld(screenPos.x, screenPos.y);
            onContextMenu?.(screenPos, worldPos);
            rightClickStartRef.current = null;
            rightClickMovedRef.current = false;
            setMode('IDLE');
            return;
        }

        if (mode !== 'IDLE') {
            // Trigger save if we were modifying nodes
             if ((mode === 'DRAGGING_NODES' || mode === 'RESIZING_NODE') && onInteractionEnd) {
                  onInteractionEnd();
              }

             setMode('IDLE');
             setSelectionBox(null);
             setConnectionDrag(null);
             resizingStateRef.current = null;
             rightClickStartRef.current = null;
             rightClickMovedRef.current = false;
        }
    }
  };

  const handleWheel = (e: React.WheelEvent): void => {
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

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.size > 0) {
      e.preventDefault();
      const nodeIdsToDelete = Array.from(selectedNodeIds);
      setSelectedNodeIds(new Set());
      if (onDeleteNodes) {
        onDeleteNodes(nodeIdsToDelete);
      }
    }
  };

  // --- Rendering ---

  const detachedConnection = connectionDrag?.detachedConnection;

  const connectionLines = schema.connections
    .filter((conn) => conn.from !== detachedConnection?.from || conn.to !== detachedConnection.to)
    .map((conn, idx) => {
    const start = portPositions.get(conn.from);
    const end = portPositions.get(conn.to);

    const sourceNode = schema.nodes.find(n => n.outputs?.some(o => o.id === conn.from));
    const targetNode = schema.nodes.find(n => n.inputs?.some(i => i.id === conn.to));
    const sourcePortDef = sourceNode?.outputs?.find(o => o.id === conn.from);
    const targetPortDef = targetNode?.inputs?.find(i => i.id === conn.to);

    if (start && end && sourcePortDef && targetPortDef) {
      return (
        <ConnectionLine
          key={`${conn.from}-${conn.to}-${String(idx)}`}
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

  const previewConnection = connectionDrag && (
    <ConnectionLine
      x1={connectionDrag.anchorDirection === 'output' ? connectionDrag.anchorPos.x : connectionDrag.currentPos.x}
      y1={connectionDrag.anchorDirection === 'output' ? connectionDrag.anchorPos.y : connectionDrag.currentPos.y}
      x2={connectionDrag.anchorDirection === 'output' ? connectionDrag.currentPos.x : connectionDrag.anchorPos.x}
      y2={connectionDrag.anchorDirection === 'output' ? connectionDrag.currentPos.y : connectionDrag.anchorPos.y}
      sourceType={connectionDrag.anchorType}
      targetType={connectionDrag.anchorType}
      isPreview
    />
  );

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={`w-full h-full bg-[#111] overflow-hidden relative touch-none select-none outline-none
        ${mode === 'PANNING' ? 'cursor-grabbing' : ''}
        ${mode === 'DRAGGING_NODES' ? 'cursor-move' : ''}
        ${mode === 'DRAGGING_CONNECTION' ? 'cursor-grabbing' : ''}
        ${mode === 'IDLE' ? 'cursor-default' : ''}
        ${mode === 'BOX_SELECTING' ? 'cursor-crosshair' : ''}
        ${mode === 'RESIZING_NODE' ? 'cursor-nwse-resize' : ''} 
      `}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => { e.preventDefault(); }}
    >
        {/* Grid Background */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: `${String(20 * viewport.scale)}px ${String(20 * viewport.scale)}px`,
                backgroundPosition: `${String(viewport.x)}px ${String(viewport.y)}px`
            }}
        />

        {/* World Transform Layer */}
        <div 
            style={{
                transform: `translate(${String(viewport.x)}px, ${String(viewport.y)}px) scale(${String(viewport.scale)})`,
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
                {previewConnection}
            </svg>

            {/* 2. Nodes rendered on top */}
            {schema.nodes.map(node => (
                <NodeWidget 
                    key={node.id} 
                    data={node} 
                    onInputValueChange={handleInputValueChange}
                    isSelected={selectedNodeIds.has(node.id)}
                    activePortId={connectionDrag ? (connectionDrag.detachedConnection ? connectionDrag.anchorPortId : connectionDrag.startedFromPortId) : null}
                    hoveredPortId={connectionDrag?.hoveredPortId ?? null}
                    hoveredPortValid={connectionDrag?.hoveredPortValid ?? false}
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
            {mode === 'DRAGGING_CONNECTION'
              ? 'Drag to a compatible port and release'
              : selectedNodeIds.size > 0
                ? `${String(selectedNodeIds.size)} selected | Del: Delete`
                : 'L-Click: Select | Drag Ports: Connect | Wheel: Zoom | Middle/Right: Pan'}
        </div>
    </div>
  );
};
