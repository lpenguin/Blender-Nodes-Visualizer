import React, { useState, useEffect } from 'react';
import { GraphCanvas } from './components/NodeGraph/GraphCanvas';
import { Toolbar } from './components/UI/Toolbar';
import { JsonEditor } from './components/UI/JsonEditor';
import { ToastProvider } from './components/UI/Toast';
import { parseGraphJSON } from './utils';
import { DEFAULT_JSON_EXAMPLE } from './constants';
import { GraphSchema, NodeData } from './types';

function App() {
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON_EXAMPLE);
  const [schema, setSchema] = useState<GraphSchema | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState<boolean>(false); // Hidden by default on mobile load, handy on desktop

  // Parse JSON whenever input changes
  useEffect(() => {
    // If input is empty, clear schema and error, do not show "Invalid JSON"
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
        setShowEditor(true);
    }
  }, []);

  const handleNodesChange = (updatedNodes: NodeData[]) => {
    if (!schema) return;
    const newSchema = { ...schema, nodes: updatedNodes };
    setSchema(newSchema);
  };

  const handleInteractionEnd = () => {
    if (!schema) return;
    // Update the JSON text when drag/resize ends. 
    // This keeps the text editor in sync without performance cost during drag.
    setJsonInput(JSON.stringify(schema, null, 2));
  };

  return (
    <ToastProvider>
      <div className="w-screen h-screen flex flex-col bg-neutral-900 overflow-hidden text-neutral-200 font-sans">
        <Toolbar 
          onToggleEditor={() => setShowEditor(!showEditor)} 
          showEditor={showEditor}
          hasError={!!parseError}
        />
        
        <div className="flex-1 relative">
          {/* Canvas Area */}
          <div className="absolute inset-0 z-0">
              {schema ? (
                  <GraphCanvas 
                    schema={schema} 
                    onNodesChange={handleNodesChange}
                    onInteractionEnd={handleInteractionEnd}
                  />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600 flex-col gap-4">
                      <p>No valid graph data.</p>
                  </div>
              )}
          </div>

          {/* Editor Overlay */}
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
      </div>
    </ToastProvider>
  );
}

export default App;