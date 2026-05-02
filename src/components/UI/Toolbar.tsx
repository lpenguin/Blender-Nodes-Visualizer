import React from 'react';
import { Upload, Download, PlusSquare, Code2, Box } from 'lucide-react';

interface ToolbarProps {
  onImportJson: () => void;
  onExportJson: () => void;
  canExportJson: boolean;
  hasError: boolean;
  onToggleNodePicker: () => void;
  showNodePicker: boolean;
  onToggleTSLCode: () => void;
  showTSLCode: boolean;
  onTogglePreview: () => void;
  showPreview: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onImportJson,
  onExportJson,
  canExportJson,
  hasError,
  onToggleNodePicker,
  showNodePicker,
  onToggleTSLCode,
  showTSLCode,
  onTogglePreview,
  showPreview,
}) => {
  return (
    <div className="h-14 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 z-50 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Three.js TSL Node Editor logo" role="img">
            <title>Three.js TSL Node Editor</title>
            <circle cx="4" cy="9" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="14" cy="4" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="14" cy="14" r="2.5" fill="white" fillOpacity="0.9"/>
            <line x1="6.5" y1="9" x2="11.5" y2="4.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
            <line x1="6.5" y1="9" x2="11.5" y2="13.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2"/>
          </svg>
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <h1 className="text-white font-semibold text-sm tracking-tight">
            Three.js <span className="text-blue-400">TSL</span> Node Editor
          </h1>
          <span className="text-neutral-500 text-[10px]">Three Shading Language</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasError && (
          <span className="text-red-500 text-xs font-bold mr-2 animate-pulse hidden sm:inline">
            Invalid JSON
          </span>
        )}

        {/* Preview */}
        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showPreview
              ? 'bg-purple-700 hover:bg-purple-600 text-white'
              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
          }`}
          style={{ minHeight: '36px' }}
          title="Shader Preview"
        >
          <Box size={16} />
          <span className="hidden sm:inline">{showPreview ? 'Close Preview' : 'Preview'}</span>
        </button>

        {/* Add Node */}
        <button
          onClick={onToggleNodePicker}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showNodePicker
              ? 'bg-neutral-700 text-white border border-neutral-600'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          style={{ minHeight: '36px' }}
          title="Add Node"
        >
          <PlusSquare size={16} />
          <span className="hidden sm:inline">{showNodePicker ? 'Close Picker' : 'Add Node'}</span>
        </button>

        {/* Export TSL */}
        <button
          onClick={onToggleTSLCode}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showTSLCode
              ? 'bg-neutral-700 text-white border border-neutral-600'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
          }`}
          style={{ minHeight: '36px' }}
          title="Export TSL Code"
        >
          <Code2 size={16} />
          <span className="hidden sm:inline">{showTSLCode ? 'Close Code' : 'Export TSL'}</span>
        </button>

        {/* Import JSON */}
        <button
          onClick={onImportJson}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-200 border border-neutral-700"
          style={{ minHeight: '36px' }}
          title="Import graph from JSON file"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Import JSON</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={onExportJson}
          disabled={!canExportJson}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
            canExportJson
              ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200 border-neutral-700'
              : 'bg-neutral-800 text-neutral-500 border-neutral-800 cursor-not-allowed'
          }`}
          style={{ minHeight: '36px' }}
          title="Export current graph as JSON"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export JSON</span>
        </button>
      </div>
    </div>
  );
};
