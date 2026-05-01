import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { TSL_NODE_CATALOG, TSL_CATEGORIES, TSLNodeDef } from '../../tslNodes';

interface NodePickerPopupProps {
  screenPos: { x: number; y: number };
  onClose: () => void;
  onAddNode: (def: TSLNodeDef) => void;
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

export const NodePickerPopup: React.FC<NodePickerPopupProps> = ({ screenPos, onClose, onAddNode }) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Inputs', 'Math', 'Built-in', 'Output'])
  );
  const [position, setPosition] = useState({
    x: Math.max(8, Math.min(screenPos.x, window.innerWidth - 320 - 8)),
    y: Math.max(8, Math.min(screenPos.y, window.innerHeight - 400 - 8)),
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTitlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleTitlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, e.clientX - dragOffsetRef.current.x),
      y: Math.max(0, e.clientY - dragOffsetRef.current.y),
    });
  };

  const handleTitlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };
  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

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

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSelect = (node: TSLNodeDef) => {
    onAddNode(node);
    onClose();
  };

  const popupWidth = 320;
  const popupMaxHeight = 400;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: popupWidth,
        maxHeight: popupMaxHeight,
      }}
    >
      {/* Header / Drag Handle */}
      <div
        className="flex items-center justify-between p-3 bg-neutral-800/60 border-b border-neutral-800 shrink-0 cursor-grab active:cursor-grabbing"
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
      >
        <span className="text-sm font-semibold text-neutral-200 select-none">Add Node</span>
      </div>

      {/* Search */}
      <div className="p-2 shrink-0 border-b border-neutral-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {Array.from(nodesByCategory.entries()).map(([cat, nodes]) => {
          if (nodes.length === 0) return null;
          const isExpanded = expandedCategories.has(cat) || search.trim().length > 0;

          return (
            <div key={cat}>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50"
                onClick={() => toggleCategory(cat)}
                aria-expanded={isExpanded}
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
                <div>
                  {nodes.map(node => (
                    <button
                      key={node.type}
                      className="w-full flex flex-col gap-0.5 px-4 py-2 text-left hover:bg-neutral-800 transition-colors group border-b border-neutral-800/30"
                      onClick={() => handleSelect(node)}
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

        {filteredNodes.length === 0 && (
          <div className="p-6 text-center text-neutral-500 text-sm">
            No nodes match "{search}"
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-neutral-800/30 border-t border-neutral-800 shrink-0">
        <p className="text-[10px] text-neutral-600">Click a node to add it under cursor</p>
      </div>
    </div>
  );
};
