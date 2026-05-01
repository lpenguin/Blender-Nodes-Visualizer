import React from 'react';
import { Trash2 } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  isOpen: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-0 bottom-0 w-full sm:w-[400px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 flex flex-col transition-transform duration-300">
      <div className="flex items-center justify-between p-2 px-3 bg-neutral-800/50 border-b border-neutral-800 shrink-0">
        <span className="text-xs text-neutral-400 truncate mr-2">
           Paste AI-generated JSON schema.
        </span>
        <button
            onClick={() => { onChange(''); }}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 border border-neutral-700 rounded text-xs transition-colors"
            title="Clear JSON"
        >
            <Trash2 size={14} />
            <span>Clear</span>
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        className="flex-1 w-full bg-[#1e1e1e] text-neutral-300 p-4 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-blue-500/50"
        spellCheck={false}
        placeholder='{ "nodes": [], "connections": [] }'
      />
    </div>
  );
};