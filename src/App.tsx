import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GraphCanvas } from './components/NodeGraph/GraphCanvas';
import { Toolbar } from './components/UI/Toolbar';
import { ToastProvider } from './components/UI/Toast';
import { NodePicker } from './components/UI/NodePicker';
import { TSLCodePanel } from './components/UI/TSLCodePanel';
import { ShaderPreview } from './components/UI/ShaderPreview';
import { applyConnectionState, parseGraphJSON } from './utils';
import { exportTSL } from './tslExport';
import { DEFAULT_JSON_EXAMPLE } from './constants';
import { GraphSchema, NodeData, ConnectionData } from './types';
import { TSLNodeDef } from './tslNodes';

function App(): React.ReactElement {
  const initialGraph = useMemo(() => parseGraphJSON(DEFAULT_JSON_EXAMPLE), []);
  const [schema, setSchema] = useState<GraphSchema | null>(initialGraph.schema);
  const [parseError, setParseError] = useState<string | null>(initialGraph.error);
  const [showNodePicker, setShowNodePicker] = useState<boolean>(false);
  const [nodePickerPosition, setNodePickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [nodePickerWorldPosition, setNodePickerWorldPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTSLCode, setShowTSLCode] = useState<boolean>(false);
  const [tslCode, setTslCode] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(window.innerWidth > 768);
  const [previewWidth, setPreviewWidth] = useState<number>(300);
  const [previewShape, setPreviewShape] = useState<'cube' | 'sphere'>('cube');
  const isResizingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResizeStart = (e: React.PointerEvent): void => {
    isResizingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleResizeMove = (e: React.PointerEvent): void => {
    if (!isResizingRef.current) return;
    const newWidth = Math.min(800, Math.max(200, window.innerWidth - e.clientX));
    setPreviewWidth(newWidth);
  };

  const handleResizeEnd = (e: React.PointerEvent): void => {
    isResizingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleNodesChange = (updatedNodes: NodeData[]): void => {
    if (!schema) return;
    const newSchema = applyConnectionState({ ...schema, nodes: updatedNodes });
    setSchema(newSchema);
  };

  const handleConnectionsChange = (updatedConnections: ConnectionData[]): void => {
    if (!schema) return;
    const newSchema = applyConnectionState({ ...schema, connections: updatedConnections });
    setSchema(newSchema);
  };

  const handleInteractionEnd = (nextSchema?: GraphSchema): void => {
    const schemaToPersist = nextSchema ? applyConnectionState(nextSchema) : schema;
    if (!schemaToPersist) return;
    setSchema(schemaToPersist);
  };

  const handleImportJson = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    const { schema: parsedSchema, error } = parseGraphJSON(text);
    if (parsedSchema) {
      setSchema(parsedSchema);
      setParseError(null);
      setShowTSLCode(false);
      return;
    }

    setParseError(error);
  };

  const handleExportJson = (): void => {
    if (!schema) return;

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Add a node from the picker onto the canvas
  const handleAddNode = useCallback((def: TSLNodeDef, position?: { x: number; y: number }) => {
    const newSchema = schema ?? { nodes: [], connections: [] };

    // Place the new node near the center of the viewport with slight offset
    const existingCount = newSchema.nodes.length;
    const nextPosition = position ?? { x: 100 + (existingCount % 5) * 230, y: 80 + Math.floor(existingCount / 5) * 180 };

    // Build a unique id — check for actual collisions
    const baseId = def.type.replace('tsl:', '').toLowerCase();
    const takenIds = new Set(newSchema.nodes.map(n => n.id));
    let id = baseId;
    let counter = 2;
    while (takenIds.has(id)) {
      id = `${baseId}_${String(counter++)}`;
    }

    const newNode: NodeData = {
      id,
      name: def.name,
      type: def.type,
      position: nextPosition,
      inputs: def.inputs.map(p => ({
        id: `${id}_${p.id}`,
        name: p.name,
        type: p.type,
        value: p.defaultValue,
        connected: false,
      })),
      outputs: def.outputs.map(p => ({
        id: `${id}_${p.id}`,
        name: p.name,
        type: p.type,
      })),
    };

    const updated = applyConnectionState({
      ...newSchema,
      nodes: [...newSchema.nodes, newNode],
    });
    setSchema(updated);
  }, [schema]);

  const handleOpenNodePicker = useCallback((screenPos?: { x: number; y: number }) => {
    setNodePickerPosition(screenPos ?? null);
    setNodePickerWorldPosition(null);
    setShowNodePicker(true);
  }, []);

  const handleCloseNodePicker = useCallback(() => {
    setShowNodePicker(false);
    setNodePickerPosition(null);
    setNodePickerWorldPosition(null);
  }, []);

  const handleCanvasContextMenu = useCallback((screenPos: { x: number; y: number }, worldPos: { x: number; y: number }) => {
    setNodePickerPosition(screenPos);
    setNodePickerWorldPosition(worldPos);
    setShowNodePicker(true);
  }, []);

  const handleAddNodeFromPicker = useCallback((def: TSLNodeDef) => {
    handleAddNode(def, nodePickerWorldPosition ?? undefined);
  }, [handleAddNode, nodePickerWorldPosition]);

  // Generate TSL code and open the panel
  const handleToggleTSLCode = (): void => {
    if (!showTSLCode && schema) {
      setTslCode(exportTSL(schema));
    }
    setShowTSLCode(v => !v);
  };

  // Delete selected nodes and their connected wires
  const handleDeleteNodes = useCallback((nodeIds: string[]) => {
    if (!schema) return;
    const nodeIdSet = new Set(nodeIds);
    
    // Collect all port IDs belonging to deleted nodes
    const deletedPortIds = new Set<string>();
    for (const node of schema.nodes) {
      if (nodeIdSet.has(node.id)) {
        node.inputs?.forEach(p => deletedPortIds.add(p.id));
        node.outputs?.forEach(p => deletedPortIds.add(p.id));
      }
    }
    
    // Remove deleted nodes
    const remainingNodes = schema.nodes.filter(n => !nodeIdSet.has(n.id));
    
    // Remove connections that involve deleted ports
    const remainingConnections = schema.connections.filter(
      conn => !deletedPortIds.has(conn.from) && !deletedPortIds.has(conn.to)
    );
    
    const updated = applyConnectionState({
      ...schema,
      nodes: remainingNodes,
      connections: remainingConnections,
    });
    
    setSchema(updated);
  }, [schema]);

  return (
    <ToastProvider>
      <div
        className="w-screen h-screen flex flex-col bg-neutral-900 overflow-hidden text-neutral-200 font-sans"
        onContextMenu={(e) => { e.preventDefault(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => { void handleFileImport(event); }}
        />
        <Toolbar
          onImportJson={handleImportJson}
          onExportJson={handleExportJson}
          canExportJson={schema !== null}
          hasError={!!parseError}
          onToggleNodePicker={() => {
            if (showNodePicker) {
              handleCloseNodePicker();
            } else {
              handleOpenNodePicker();
            }
          }}
          showNodePicker={showNodePicker}
          onToggleTSLCode={handleToggleTSLCode}
          showTSLCode={showTSLCode}
          onTogglePreview={() => { setShowPreview(!showPreview); }}
          showPreview={showPreview}
        />

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 relative min-w-0">
            {/* Canvas Area */}
            <div className="absolute inset-0 z-0">
              {schema ? (
                  <GraphCanvas
                    schema={schema}
                    onNodesChange={handleNodesChange}
                    onConnectionsChange={handleConnectionsChange}
                    onInteractionEnd={handleInteractionEnd}
                    onDeleteNodes={handleDeleteNodes}
                    onContextMenu={handleCanvasContextMenu}
                  />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 flex-col gap-4">
                  <p>No valid graph data.</p>
                </div>
              )}
            </div>

            {/* Node Picker Overlay */}
            <NodePicker
              isOpen={showNodePicker}
              onClose={handleCloseNodePicker}
              onAddNode={handleAddNodeFromPicker}
              initialScreenPosition={nodePickerPosition}
            />

            {/* TSL Code Panel Overlay */}
            <TSLCodePanel
              isOpen={showTSLCode}
              code={tslCode}
              onClose={() => { setShowTSLCode(false); }}
            />

            {/* Error Toast */}
            {parseError && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg shadow-lg text-sm border border-red-700 z-50 max-w-[90vw]">
                Error: {parseError}
              </div>
            )}
          </div>

          {showPreview && (
            <>
              <div
                onPointerDown={handleResizeStart}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="w-1 cursor-col-resize hover:w-1.5 hover:bg-neutral-400/60 transition-all shrink-0 z-30"
              />
              <ShaderPreview
                schema={schema}
                isOpen={showPreview}
                onClose={() => { setShowPreview(false); }}
                width={previewWidth}
                shape={previewShape}
                onShapeChange={setPreviewShape}
              />
            </>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
