import React from 'react';
import { X, Clock3, Download } from 'lucide-react';
import { SavedMaterial } from '../../types';

interface MaterialLoadDialogProps {
  isOpen: boolean;
  materials: SavedMaterial[];
  onClose: () => void;
  onLoad: (name: string) => void;
}

const formatUpdatedAt = (updatedAt: number): string => {
  return new Date(updatedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MaterialLoadDialog: React.FC<MaterialLoadDialogProps> = ({ isOpen, materials, onClose, onLoad }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onPointerDown={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,460px)] max-h-[80vh] overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-800/70">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Load Material</h2>
            <p className="text-[11px] text-neutral-500">Saved in local storage</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {materials.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-sm">
              No saved materials yet.
            </div>
          ) : (
            materials.map(material => (
              <button
                key={material.name}
                className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 transition-colors px-3 py-3 mb-2"
                onClick={() => {
                  onLoad(material.name);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-100 truncate">{material.name}</div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
                      <Clock3 size={11} />
                      <span>{formatUpdatedAt(material.updatedAt)}</span>
                    </div>
                  </div>
                  <Download size={16} className="text-neutral-500 shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
