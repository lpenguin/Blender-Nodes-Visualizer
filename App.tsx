import React, { useState, useEffect, useCallback } from 'react';
import { GraphCanvas } from './components/NodeGraph/GraphCanvas';
import { Toolbar } from './components/UI/Toolbar';
import { JsonEditor } from './components/UI/JsonEditor';
import { ToastProvider } from './components/UI/Toast';
import { NodePicker } from './components/UI/NodePicker';
import { TSLCodePanel } from './components/UI/TSLCodePanel';
import { ShaderPreview } from './components/UI/ShaderPreview';
import { applyConnectionState, parseGraphJSON } from './utils';
import { exportTSL } from './tslExport';
import { DEFAULT_JSON_EXAMPLE } from './constants';
import { GraphSchema, NodeData, ConnectionData } from './types';
import { TSLNodeDef } from './tslNodes';

function App() {
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON_EXAMPLE);
  const [schema, setSchema] = useState<GraphSchema | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [showNodePicker, setShowNodePicker] = useState<boolean>(false);
  const [showTSLCode, setShowTSLCode] = useState<boolean>(false);
  const [tslCode, setTslCode] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(window.innerWidth > 768);

  // Parse JSON whenever input changes
  useEffect(() => {
    if (!jsonInput.trim()) {
      setSchema(null);
      setParseError(null);
      return;
    }

    const { schema: parsedSchema, error } = parseGraphJSON(jsonInput);
    if (parsedSchema) {
      setSchema(parsedSchema);
      setParseError(null);
    } else {
      setParseError(error);
    }
  }, [jsonInput]);

  // Initial responsive check
  useEffect(() => {
    if (window.innerWidth > 768) {
      setShowEditor(false);
    }
  }, []);

  const handleNodesChange = (updatedNodes: NodeData[]) => {
    if (!schema) return;
    const newSchema = applyConnectionState({ ...schema, nodes: updatedNodes });
    setSchema(newSchema);
  };

  const handleConnectionsChange = (updatedConnections: ConnectionData[]) => {
    if (!schema) return;
    const newSchema = applyConnectionState({ ...schema, connections: updatedConnections });
    setSchema(newSchema);
  };

  const handleInteractionEnd = (nextSchema?: GraphSchema) => {
    const schemaToPersist = nextSchema ? applyConnectionState(nextSchema) : schema;
    if (!schemaToPersist) return;
    setJsonInput(JSON.stringify(schemaToPersist, null, 2));
  };

  // Add a node from the picker onto the canvas
  const handleAddNode = useCallback((def: TSLNodeDef) => {
    const newSchema = schema ?? { nodes: [], connections: [] };

    // Place the new node near the center of the viewport with slight offset
    const existingCount = newSchema.nodes.length;
    const position = { x: 100 + (existingCount % 5) * 230, y: 80 + Math.floor(existingCount / 5) * 180 };

    // Build a unique id — check for actual collisions
    const baseId = def.type.replace('tsl:', '').toLowerCase();
    const takenIds = new Set(newSchema.nodes.map(n => n.id));
    let id = baseId;
    let counter = 2;
    while (takenIds.has(id)) {
      id = `${baseId}_${counter++}`;
    }

    const newNode: NodeData = {
      id,
      name: def.name,
      type: def.type,
      position,
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
    setJsonInput(JSON.stringify(updated, null, 2));
  }, [schema]);

  // Generate TSL code and open the panel
  const handleToggleTSLCode = () => {
    if (!showTSLCode && schema) {
      setTslCode(exportTSL(schema));
    }
    setShowTSLCode(v => !v);
  };

  return (
    <ToastProvider>
      <div className="w-screen h-screen flex flex-col bg-neutral-900 overflow-hidden text-neutral-200 font-sans">
        <Toolbar
          onToggleEditor={() => setShowEditor(!showEditor)}
          showEditor={showEditor}
          hasError={!!parseError}
          onToggleNodePicker={() => setShowNodePicker(!showNodePicker)}
          showNodePicker={showNodePicker}
          onToggleTSLCode={handleToggleTSLCode}
          showTSLCode={showTSLCode}
          onTogglePreview={() => setShowPreview(!showPreview)}
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
              onClose={() => setShowNodePicker(false)}
              onAddNode={handleAddNode}
            />

            {/* TSL Code Panel Overlay */}
            <TSLCodePanel
              isOpen={showTSLCode}
              code={tslCode}
              onClose={() => setShowTSLCode(false)}
            />

            {/* JSON Editor Overlay */}
            <JsonEditor
              value={jsonInput}
              onChange={setJsonInput}
              isOpen={showEditor}
            />

            {/* Error Toast */}
            {parseError && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg shadow-lg text-sm border border-red-700 z-50 max-w-[90vw]">
                Error: {parseError}
              </div>
            )}
          </div>

          <ShaderPreview
            schema={schema}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
          />
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
