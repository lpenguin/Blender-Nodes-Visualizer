import React, { useState } from 'react';
import { X, Copy, Check, Code2 } from 'lucide-react';

interface TSLCodePanelProps {
  isOpen: boolean;
  code: string;
  onClose: () => void;
}

export const TSLCodePanel: React.FC<TSLCodePanelProps> = ({ isOpen, code, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      // Clipboard API unavailable — select the code text as fallback
      const pre = document.querySelector('.tsl-code-content');
      if (pre !== null) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(pre);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 top-14 sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[520px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-neutral-800/60 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-neutral-200">TSL Shader Code</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { void handleCopy(); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              copied
                ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200 border border-neutral-600'
            }`}
            title="Copy to clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto bg-[#1a1a2e]">
        <pre className="tsl-code-content p-4 text-xs font-mono text-neutral-300 whitespace-pre leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-neutral-800/30 border-t border-neutral-800 shrink-0">
        <p className="text-[10px] text-neutral-500">
          Paste this into your Three.js project using{' '}
          <span className="text-blue-400 font-mono">WebGPURenderer</span> with node materials.
        </p>
      </div>
    </div>
  );
};
