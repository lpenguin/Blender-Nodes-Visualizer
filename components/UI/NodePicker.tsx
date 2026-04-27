import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { TSL_NODE_CATALOG, TSL_CATEGORIES, TSLNodeDef } from '../../tslNodes';

interface NodePickerProps {
  isOpen: boolean;
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

export const NodePicker: React.FC<NodePickerProps> = ({ isOpen, onClose, onAddNode }) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Inputs', 'Math', 'Built-in', 'Output'])
  );

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
      map.get(node.category)!.push(node);
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

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 left-0 bottom-0 w-full sm:w-[300px] bg-neutral-900 border-r border-neutral-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-neutral-800/60 border-b border-neutral-800 shrink-0">
        <span className="text-sm font-semibold text-neutral-200">Add Node</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 shrink-0 border-b border-neutral-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search nodes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            autoFocus
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
              {/* Category header */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50"
                onClick={() => toggleCategory(cat)}
              >
                <span className="text-base leading-none">{CATEGORY_ICONS[cat] ?? '•'}</span>
                <span className="flex-1 text-left">{cat}</span>
                <span className="text-neutral-600 text-[10px]">{nodes.length}</span>
                <ChevronRight
                  size={12}
                  className={`text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              {/* Node items */}
              {isExpanded && nodes.map(node => (
                <button
                  key={node.type}
                  className="w-full flex flex-col gap-0.5 px-4 py-2 text-left hover:bg-neutral-800 transition-colors group border-b border-neutral-800/30"
                  onClick={() => {
                    onAddNode(node);
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
        <p className="text-[10px] text-neutral-600">Click a node to add it to the canvas</p>
      </div>
    </div>
  );
};
