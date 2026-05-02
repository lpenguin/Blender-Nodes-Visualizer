import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { TSL_NODE_CATALOG, TSL_CATEGORIES, TSLNodeDef } from '../../tslNodes';
import { TSLPortDef } from '../../tslHandlerContext';

export interface NodePickerConnectionContext {
  anchorDirection: 'input' | 'output';
}

export interface NodePickerSelection {
  def: TSLNodeDef;
  selectedPort?: TSLPortDef;
  selectedPortDirection?: 'input' | 'output';
}

interface ConnectionEntry {
  key: string;
  def: TSLNodeDef;
  port: TSLPortDef;
  selectedPortDirection: 'input' | 'output';
  label: string;
}

interface NodePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (selection: NodePickerSelection) => void;
  initialScreenPosition?: { x: number; y: number } | null;
  connectionContext?: NodePickerConnectionContext | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  Inputs: '⬛',
  Math: '➕',
  Vector: '↗',
  Texture: '🖼',
  'Built-in': '⚡',
  Color: '🎨',
  Utility: '🔧',
  Output: '📤',
};

const PICKER_WIDTH = 320;
const PICKER_MAX_HEIGHT = 420;
const VIEWPORT_MARGIN = 12;
const TITLE_BAR_HEIGHT = 44;

const clampPickerPosition = (position: { x: number; y: number }): { x: number; y: number } => ({
  x: Math.max(VIEWPORT_MARGIN, Math.min(position.x, window.innerWidth - PICKER_WIDTH - VIEWPORT_MARGIN)),
  y: Math.max(VIEWPORT_MARGIN, Math.min(position.y, window.innerHeight - PICKER_MAX_HEIGHT - VIEWPORT_MARGIN)),
});

export const NodePicker: React.FC<NodePickerProps> = ({
  isOpen,
  onClose,
  onAddNode,
  initialScreenPosition,
  connectionContext,
}) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Inputs', 'Math', 'Built-in', 'Output'])
  );
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: VIEWPORT_MARGIN, y: 56 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TSL_NODE_CATALOG;
    return TSL_NODE_CATALOG.filter(
      n =>
        n.name.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.tslFn.toLowerCase().includes(q)
    );
  }, [search]);

  const connectionEntries = useMemo(() => {
    if (!connectionContext) return [];

    const selectedPortDirection = connectionContext.anchorDirection === 'output' ? 'input' : 'output';

    return filteredNodes.flatMap<ConnectionEntry>((def) => {
      const ports = selectedPortDirection === 'input' ? def.inputs : def.outputs;
      return ports.map((port) => ({
        key: `${def.type}:${selectedPortDirection}:${port.id}`,
        def,
        port,
        selectedPortDirection,
        label: `${def.name}.${port.name}`,
      }));
    });
  }, [connectionContext, filteredNodes]);

  const nodesByCategory = useMemo(() => {
    const map = new Map<string, TSLNodeDef[]>();
    for (const cat of TSL_CATEGORIES) map.set(cat, []);
    for (const node of filteredNodes) {
      if (!map.has(node.category)) map.set(node.category, []);
      const nodes = map.get(node.category);
      if (nodes) nodes.push(node);
    }
    return map;
  }, [filteredNodes]);

  const toggleCategory = (cat: string): void => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    const nextPosition = initialScreenPosition
      ? clampPickerPosition(initialScreenPosition)
      : clampPickerPosition({ x: VIEWPORT_MARGIN, y: 56 });

    setPosition(nextPosition);
    setIsDragging(false);
    setSearch('');
    inputRef.current?.focus();
  }, [initialScreenPosition, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDragging) return;

    setPosition(clampPickerPosition({
      x: e.clientX - dragOffsetRef.current.x,
      y: e.clientY - dragOffsetRef.current.y,
    }));
  };

  const handleTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onPointerDown={onClose} />
      <div
        className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl"
        style={{
          left: `${String(position.x)}px`,
          top: `${String(position.y)}px`,
          width: `${String(PICKER_WIDTH)}px`,
          maxHeight: `${String(PICKER_MAX_HEIGHT)}px`,
        }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onContextMenu={(e) => { e.preventDefault(); }}
      >
        <div
          className={`flex items-center justify-between border-b border-neutral-800 bg-neutral-800/80 px-3 py-2.5 shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ minHeight: `${String(TITLE_BAR_HEIGHT)}px` }}
          onPointerDown={handleTitlePointerDown}
          onPointerMove={handleTitlePointerMove}
          onPointerUp={handleTitlePointerUp}
        >
          <span className="select-none text-sm font-semibold text-neutral-200">Add Node</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-2 shrink-0 border-b border-neutral-800">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search nodes…"
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {connectionContext ? connectionEntries.map((entry) => (
            <button
              key={entry.key}
              className="w-full flex flex-col gap-0.5 px-4 py-2 text-left hover:bg-neutral-800 transition-colors group border-b border-neutral-800/30"
              onClick={() => {
                onAddNode({
                  def: entry.def,
                  selectedPort: entry.port,
                  selectedPortDirection: entry.selectedPortDirection,
                });
                onClose();
              }}
              title={entry.def.description}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-200 font-medium group-hover:text-white transition-colors">
                  {entry.label}
                </span>
                <span className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-400 transition-colors shrink-0">
                  {entry.def.tslFn}()
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors leading-tight line-clamp-1">
                {entry.def.description}
              </p>
            </button>
          )) : Array.from(nodesByCategory.entries()).map(([cat, nodes]) => {
            if (nodes.length === 0) return null;
            const isExpanded = expandedCategories.has(cat) || search.trim().length > 0;

            return (
              <div key={cat}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50"
                  onClick={() => { toggleCategory(cat); }}
                  aria-expanded={isExpanded}
                  aria-controls={`cat-${cat}`}
                >
                  <span className="text-base leading-none" aria-hidden="true">{CATEGORY_ICONS[cat] ?? '•'}</span>
                  <span className="flex-1 text-left">{cat}</span>
                  <span className="text-neutral-600 text-[10px]">{nodes.length}</span>
                  <ChevronRight
                    size={12}
                    className={`text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isExpanded && (
                  <div id={`cat-${cat}`}>
                    {nodes.map(node => (
                      <button
                        key={node.type}
                        className="w-full flex flex-col gap-0.5 px-4 py-2 text-left hover:bg-neutral-800 transition-colors group border-b border-neutral-800/30"
                        onClick={() => {
                          onAddNode({ def: node });
                          onClose();
                        }}
                        title={node.description}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-neutral-200 font-medium group-hover:text-white transition-colors">
                            {node.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-400 transition-colors shrink-0">
                            {node.tslFn}()
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors leading-tight line-clamp-1">
                          {node.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {((connectionContext ? connectionEntries.length : filteredNodes.length) === 0) && (
            <div className="p-6 text-center text-neutral-500 text-sm">
              No nodes match "{search}"
            </div>
          )}
        </div>

        <div className="px-3 py-2 bg-neutral-800/30 border-t border-neutral-800 shrink-0">
          <p className="text-[10px] text-neutral-600">Drag the title bar to reposition this picker</p>
        </div>
      </div>
    </>
  );
};
