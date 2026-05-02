import React from 'react';
import { Upload, Download, PlusSquare, Code2, Box, FileText, ChevronDown, Save, Copy, FolderOpen } from 'lucide-react';

interface ToolbarProps {
  materialName: string;
  onMaterialNameChange: (name: string) => void;
  onSaveMaterial: () => void;
  onLoadMaterial: () => void;
  onDuplicateMaterial: () => void;
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
  materialName,
  onMaterialNameChange,
  onSaveMaterial,
  onLoadMaterial,
  onDuplicateMaterial,
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
  const [showFileMenu, setShowFileMenu] = React.useState(false);

  React.useEffect(() => {
    const handlePointerDown = (): void => {
      setShowFileMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setShowFileMenu(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="h-14 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 z-50 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
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
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFileMenu(v => !v);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-neutral-700 hover:bg-neutral-600 text-neutral-200 border border-neutral-700 transition-colors"
              style={{ minHeight: '36px' }}
              title="File menu"
            >
              <FileText size={16} />
              <span>File</span>
              <ChevronDown size={14} className="text-neutral-400" />
            </button>
            {showFileMenu && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-48 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden z-50" onPointerDown={(e) => { e.stopPropagation(); }}>
                <button onClick={() => { setShowFileMenu(false); onSaveMaterial(); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Save size={14} /> Save <span className="ml-auto text-[11px] text-neutral-500">Ctrl-S</span>
                </button>
                <button onClick={() => { setShowFileMenu(false); onLoadMaterial(); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <FolderOpen size={14} /> Load <span className="ml-auto text-[11px] text-neutral-500">Ctrl-O</span>
                </button>
                <button onClick={() => { setShowFileMenu(false); onDuplicateMaterial(); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Copy size={14} /> Duplicate
                </button>
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Material</span>
            <input
              value={materialName}
              onChange={(e) => { onMaterialNameChange(e.target.value); }}
              className="w-56 max-w-[40vw] bg-transparent border-b border-neutral-700 focus:border-blue-500 outline-none text-sm text-white placeholder-neutral-500 py-0.5"
              aria-label="Material name"
            />
          </div>
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
