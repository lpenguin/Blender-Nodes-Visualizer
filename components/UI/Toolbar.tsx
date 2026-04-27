import React from 'react';
import { Menu, X, FileJson } from 'lucide-react';

interface ToolbarProps {
  onToggleEditor: () => void;
  showEditor: boolean;
  hasError: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onToggleEditor, showEditor, hasError }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-14 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center text-white font-bold shadow-lg">
           Bn
         </div>
         <h1 className="text-white font-semibold text-lg tracking-tight hidden sm:block">
           Node <span className="text-neutral-400 font-normal">Visualizer</span>
         </h1>
      </div>

      <div className="flex items-center gap-2">
        {hasError && (
          <span className="text-red-500 text-xs font-bold mr-2 animate-pulse">
            Invalid JSON
          </span>
        )}
        <button
          onClick={onToggleEditor}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showEditor 
              ? 'bg-neutral-800 text-white border border-neutral-700' 
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }} // Touch target
        >
          {showEditor ? <X size={18} /> : <FileJson size={18} />}
          <span className="hidden sm:inline">{showEditor ? 'Close Input' : 'Import JSON'}</span>
        </button>
      </div>
    </div>
  );
};
