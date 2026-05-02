import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GraphCanvas } from './components/NodeGraph/GraphCanvas';
import { Toolbar } from './components/UI/Toolbar';
import { ToastProvider } from './components/UI/Toast';
import { NodePicker } from './components/UI/NodePicker';
import { TSLCodePanel } from './components/UI/TSLCodePanel';
import { ShaderPreview } from './components/UI/ShaderPreview';
import { MaterialLoadDialog } from './components/UI/MaterialLoadDialog';
import { applyConnectionState, parseGraphJSON } from './utils';
import { exportTSL } from './tslExport';
import { DEFAULT_JSON_EXAMPLE } from './constants';
import { GraphSchema, NodeData, ConnectionData, SavedMaterial } from './types';
import { TSLNodeDef } from './tslNodes';

const MATERIAL_STORAGE_KEY = 'quick-sailor.saved-materials';

const readSavedMaterials = (): SavedMaterial[] => {
  try {
    const raw = window.localStorage.getItem(MATERIAL_STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedMaterial => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Partial<SavedMaterial>;
      return typeof candidate.name === 'string'
        && candidate.schema !== undefined
        && typeof candidate.updatedAt === 'number';
    });
  } catch {
    return [];
  }
};

const writeSavedMaterials = (materials: SavedMaterial[]): void => {
  window.localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(materials));
};

const uniqueMaterialName = (baseName: string, existingNames: Set<string>): string => {
  if (!existingNames.has(baseName)) return baseName;
  let counter = 2;
  let nextName = `${baseName} ${String(counter)}`;
  while (existingNames.has(nextName)) {
    counter += 1;
    nextName = `${baseName} ${String(counter)}`;
  }
  return nextName;
};

interface HistoryState {
  past: GraphSchema[];
  present: GraphSchema | null;
  future: GraphSchema[];
}

const normalizeSchema = (schema: GraphSchema | null): GraphSchema | null => {
  if (!schema) return null;
  return applyConnectionState(schema);
};

function App(): React.ReactElement {
  const initialGraph = useMemo(() => parseGraphJSON(DEFAULT_JSON_EXAMPLE), []);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: normalizeSchema(initialGraph.schema),
    future: [],
  });
  const [parseError, setParseError] = useState<string | null>(initialGraph.error);
  const [materialName, setMaterialName] = useState<string>('Untitled Material');
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showLoadDialog, setShowLoadDialog] = useState<boolean>(false);
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
  const saveToastTimeoutRef = useRef<number | null>(null);
  const gestureBaselineRef = useRef<GraphSchema | null>(null);

  const schema = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  useEffect(() => {
    setSavedMaterials(readSavedMaterials());
  }, []);

  const persistMaterials = useCallback((nextMaterials: SavedMaterial[]): void => {
    setSavedMaterials(nextMaterials);
    writeSavedMaterials(nextMaterials);
  }, []);

  const setSchemaLive = useCallback((nextSchema: GraphSchema | null): void => {
    setHistory((current) => ({
      ...current,
      present: normalizeSchema(nextSchema),
    }));
  }, []);

  const commitSchema = useCallback((nextSchema: GraphSchema | null): void => {
    setHistory((current) => {
      const normalized = normalizeSchema(nextSchema);
      if (!normalized) {
        if (current.present === null) return current;
        return { past: [...current.past, current.present], present: null, future: [] };
      }

      if (current.present && JSON.stringify(current.present) === JSON.stringify(normalized) && !gestureBaselineRef.current) {
        return current;
      }

      const baseline = gestureBaselineRef.current;
      const nextPast = baseline
        ? [...current.past, baseline]
        : (current.present ? [...current.past, current.present] : current.past);

      return {
        past: nextPast,
        present: normalized,
        future: [],
      };
    });
    gestureBaselineRef.current = null;
  }, []);

  const replaceSchema = useCallback((nextSchema: GraphSchema | null): void => {
    gestureBaselineRef.current = null;
    setHistory({ past: [], present: normalizeSchema(nextSchema), future: [] });
  }, []);

  const beginGesture = useCallback((): void => {
    if (gestureBaselineRef.current || !history.present) return;
    gestureBaselineRef.current = history.present;
  }, [history.present]);

  const undo = useCallback((): void => {
    setHistory((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: current.present ? [current.present, ...current.future] : current.future,
      };
    });
  }, []);

  const redo = useCallback((): void => {
    setHistory((current) => {
      if (current.future.length === 0) return current;
      const [next, ...rest] = current.future;
      return {
        past: current.present ? [...current.past, current.present] : current.past,
        present: next,
        future: rest,
      };
    });
  }, []);

  const saveCurrentMaterial = useCallback((name = materialName): void => {
    if (!schema) return;
    const trimmedName = name.trim() || 'Untitled Material';
    const nextMaterial: SavedMaterial = {
      name: trimmedName,
      schema,
      updatedAt: Date.now(),
    };
    const nextMaterials = [
      nextMaterial,
      ...savedMaterials.filter(material => material.name !== trimmedName),
    ];
    persistMaterials(nextMaterials);
    setMaterialName(trimmedName);
    setSaveToast(`Saved ${trimmedName}`);
  }, [materialName, persistMaterials, savedMaterials, schema]);

  const loadSavedMaterial = useCallback((name: string): void => {
    const material = savedMaterials.find(item => item.name === name);
    if (!material) return;
    commitSchema(material.schema);
    setMaterialName(material.name);
    setParseError(null);
    setShowTSLCode(false);
  }, [commitSchema, savedMaterials]);

  const duplicateCurrentMaterial = useCallback((): void => {
    if (!schema) return;
    const existingNames = new Set(savedMaterials.map(material => material.name).concat(materialName));
    const nextName = uniqueMaterialName(`${materialName || 'Untitled Material'} Copy`, existingNames);
    setMaterialName(nextName);
    saveCurrentMaterial(nextName);
  }, [materialName, savedMaterials, saveCurrentMaterial, schema]);

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
    beginGesture();
    setSchemaLive(newSchema);
  };

  const handleConnectionsChange = (updatedConnections: ConnectionData[]): void => {
    if (!schema) return;
    const newSchema = applyConnectionState({ ...schema, connections: updatedConnections });
    beginGesture();
    setSchemaLive(newSchema);
  };

  const handleInteractionEnd = (nextSchema?: GraphSchema): void => {
    const schemaToPersist = nextSchema ? applyConnectionState(nextSchema) : history.present;
    if (!schemaToPersist) return;
    commitSchema(schemaToPersist);
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
      commitSchema(parsedSchema);
      setParseError(null);
      setShowTSLCode(false);
      setMaterialName(file.name.replace(/\.json$/i, '') || 'Imported Material');
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
    commitSchema(updated);
  }, [commitSchema, schema]);

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

    commitSchema(updated);
  }, [commitSchema, schema]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveCurrentMaterial();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        setShowLoadDialog(true);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [redo, saveCurrentMaterial, undo]);

  useEffect(() => {
    if (!saveToast) return;

    if (saveToastTimeoutRef.current !== null) {
      window.clearTimeout(saveToastTimeoutRef.current);
    }

    saveToastTimeoutRef.current = window.setTimeout(() => {
      setSaveToast(null);
      saveToastTimeoutRef.current = null;
    }, 1800);

    return () => {
      if (saveToastTimeoutRef.current !== null) {
        window.clearTimeout(saveToastTimeoutRef.current);
      }
    };
  }, [saveToast]);

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
          materialName={materialName}
          onMaterialNameChange={setMaterialName}
          onSaveMaterial={() => { saveCurrentMaterial(); }}
          onLoadMaterial={() => { setShowLoadDialog(true); }}
          onDuplicateMaterial={duplicateCurrentMaterial}
          onImportJson={handleImportJson}
          onExportJson={handleExportJson}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
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

        <MaterialLoadDialog
          isOpen={showLoadDialog}
          materials={savedMaterials}
          onClose={() => { setShowLoadDialog(false); }}
          onLoad={loadSavedMaterial}
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

            {saveToast && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-neutral-800/95 text-neutral-100 px-3 py-2 rounded-lg shadow-lg text-xs border border-neutral-700 z-50 max-w-[90vw]">
                {saveToast}
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
