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
  const buttonBase =
    'flex h-8 w-8 items-center justify-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900';

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
    <>
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

        {hasError && (
          <span className="text-red-500 text-xs font-bold mr-2 animate-pulse hidden sm:inline">
            Invalid JSON
          </span>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900/90 backdrop-blur-md shadow-xl shadow-black/30 divide-x divide-neutral-700">
          <button
            onClick={onTogglePreview}
            className={`${buttonBase} ${showPreview ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
            aria-label={showPreview ? 'Close shader preview' : 'Open shader preview'}
            aria-pressed={showPreview}
            title={showPreview ? 'Close shader preview' : 'Open shader preview'}
          >
            <Box size={16} />
          </button>

          <button
            onClick={onToggleNodePicker}
            className={`${buttonBase} ${showNodePicker ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
            aria-label={showNodePicker ? 'Close node picker' : 'Open node picker'}
            aria-pressed={showNodePicker}
            title={showNodePicker ? 'Close node picker' : 'Open node picker'}
          >
            <PlusSquare size={16} />
          </button>

          <button
            onClick={onToggleTSLCode}
            className={`${buttonBase} ${showTSLCode ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
            aria-label={showTSLCode ? 'Close TSL code panel' : 'Open TSL code panel'}
            aria-pressed={showTSLCode}
            title={showTSLCode ? 'Close TSL code panel' : 'Open TSL code panel'}
          >
            <Code2 size={16} />
          </button>

          <button
            onClick={onImportJson}
            className={`${buttonBase} bg-neutral-800 text-neutral-200 hover:bg-neutral-700`}
            aria-label="Import graph from JSON file"
            title="Import graph from JSON file"
          >
            <Upload size={16} />
          </button>

          <button
            onClick={onExportJson}
            disabled={!canExportJson}
            className={`${buttonBase} ${canExportJson ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
            aria-label="Export current graph as JSON"
            title="Export current graph as JSON"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </>
  );
};
