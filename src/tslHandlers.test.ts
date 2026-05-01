import { describe, it, expect } from 'bun:test';
import { registerPlugin, getPlugin, TSLNodePlugin, TSLNodeDef, NodeBuildContext, NodeExportContext, TSLValue } from './tslHandlerContext';
import { TSL_NODE_CATALOG, TSL_NODE_BY_TYPE, TSL_CATEGORIES } from './handlers';
import { NodeData, ConnectionData } from './types';

function makeNode(overrides: Partial<NodeData> & { id: string; type: string }): NodeData {
  return {
    name: overrides.type,
    position: { x: 0, y: 0 },
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

describe('plugin registry', () => {
  it('retrieves registered plugins by type', () => {
    const plugin = getPlugin('tsl:SplitXYZ');
    expect(plugin).toBeDefined();
    expect(plugin!.type).toBe('tsl:SplitXYZ');
  });

  it('returns undefined for unregistered type', () => {
    expect(getPlugin('tsl:NonExistent')).toBeUndefined();
  });

  it('all registered plugins have matching type in their def', () => {
    const catalogTypes = TSL_NODE_CATALOG.map(d => d.type);
    for (const type of catalogTypes) {
      const plugin = getPlugin(type);
      if (plugin) {
        expect(plugin.type).toBe(type);
        expect(plugin.def.type).toBe(type);
      }
    }
  });

  it('can register a custom plugin and retrieve it', () => {
    const testType = `test:CustomNode_${String(Date.now())}`;
    const testDef: TSLNodeDef = {
      type: testType,
      name: 'Test',
      category: 'Test',
      description: 'test',
      tslFn: 'float',
      inputs: [],
      outputs: [{ id: 'out', name: 'Out', type: 'float' }],
    };
    const testPlugin: TSLNodePlugin = {
      type: testType,
      def: testDef,
      build(ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const out of ctx.node.outputs ?? []) ctx.outputVarMap.set(out.id, 42 as any);
      },
      export(ctx) {
        ctx.lines.push('const test = 42;');
      },
    };
    registerPlugin(testPlugin);
    expect(getPlugin(testType)).toBe(testPlugin);
  });
});

describe('TSL_NODE_CATALOG', () => {
  it('has entries for all expected node types', () => {
    const types = new Set(TSL_NODE_CATALOG.map(d => d.type));
    expect(types.has('tsl:PositionLocal')).toBe(true);
    expect(types.has('tsl:UV')).toBe(true);
    expect(types.has('tsl:Time')).toBe(true);
    expect(types.has('tsl:Sin')).toBe(true);
    expect(types.has('tsl:Add')).toBe(true);
    expect(types.has('tsl:Mul')).toBe(true);
    expect(types.has('tsl:SplitXYZ')).toBe(true);
    expect(types.has('tsl:CombineXYZ')).toBe(true);
    expect(types.has('tsl:TextureSample')).toBe(true);
    expect(types.has('tsl:UniformFloat')).toBe(true);
    expect(types.has('tsl:UniformVec3')).toBe(true);
    expect(types.has('tsl:UniformColor')).toBe(true);
    expect(types.has('tsl:MaterialOutput')).toBe(true);
    expect(types.has('tsl:PhysicalMaterialOutput')).toBe(true);
  });

  it('has no duplicate types', () => {
    const types = TSL_NODE_CATALOG.map(d => d.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every def has required fields', () => {
    for (const def of TSL_NODE_CATALOG) {
      expect(def.type).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.tslFn).toBeTruthy();
      expect(Array.isArray(def.inputs)).toBe(true);
      expect(Array.isArray(def.outputs)).toBe(true);
    }
  });

  it('every input has id, name, type', () => {
    for (const def of TSL_NODE_CATALOG) {
      for (const input of def.inputs) {
        expect(input.id).toBeTruthy();
        expect(input.name).toBeTruthy();
        expect(input.type).toBeTruthy();
      }
    }
  });

  it('every output has id, name, type', () => {
    for (const def of TSL_NODE_CATALOG) {
      for (const output of def.outputs) {
        expect(output.id).toBeTruthy();
        expect(output.name).toBeTruthy();
        expect(output.type).toBeTruthy();
      }
    }
  });
});

describe('TSL_NODE_BY_TYPE', () => {
  it('maps every catalog type to its def', () => {
    for (const def of TSL_NODE_CATALOG) {
      expect(TSL_NODE_BY_TYPE.get(def.type)).toBe(def);
    }
  });

  it('size matches catalog length', () => {
    expect(TSL_NODE_BY_TYPE.size).toBe(TSL_NODE_CATALOG.length);
  });
});

describe('TSL_CATEGORIES', () => {
  it('contains expected categories', () => {
    const cats = new Set(TSL_CATEGORIES);
    expect(cats.has('Inputs')).toBe(true);
    expect(cats.has('Math')).toBe(true);
    expect(cats.has('Vector')).toBe(true);
    expect(cats.has('Texture')).toBe(true);
    expect(cats.has('Built-in')).toBe(true);
    expect(cats.has('Color')).toBe(true);
    expect(cats.has('Utility')).toBe(true);
    expect(cats.has('Output')).toBe(true);
  });

  it('every catalog entry belongs to a known category', () => {
    const cats = new Set(TSL_CATEGORIES as readonly string[]);
    for (const def of TSL_NODE_CATALOG) {
      expect(cats.has(def.category)).toBe(true);
    }
  });
});

describe('plugin build + export for each handler type', () => {
  function makeBuildCtx(node: NodeData, def: TSLNodeDef): NodeBuildContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputVarMap = new Map<string, any>();
    const materialNodes: NodeData[] = [];
    const connections: ConnectionData[] = [];
    return {
      node,
      def,
      connections,
      outputVarMap,
      materialNodes,
      getInputValue(_portId: string, _portType: string, defaultValue: TSLValue) {
        return defaultValue ?? 0;
      },
      getInputRaw(_portId: string, defaultValue: TSLValue) {
        return defaultValue;
      },
      formatDefault(_type: string, _value: TSLValue) {
        return 0;
      },
    };
  }

  function makeExportCtx(node: NodeData, def: TSLNodeDef): NodeExportContext {
    const outputVarMap = new Map<string, string>();
    const nodeVarMap = new Map<string, string>();
    const lines: string[] = [];
    const imports = new Set<string>();
    const materialNodes: NodeData[] = [];
    const connections: ConnectionData[] = [];
    return {
      node,
      def,
      connections,
      outputVarMap,
      nodeVarMap,
      lines,
      imports,
      materialNodes,
      getInputExpression(_portId: string, _portType: string, defaultValue: TSLValue) {
        return String(defaultValue ?? 0);
      },
      formatDefaultValue(_type: string, value: TSLValue) {
        return String(value ?? 0);
      },
      sanitizeId(id) {
        return id.replace(/[^a-zA-Z0-9_$]/g, '_');
      },
    };
  }

  const pluginTypes = [
    'tsl:PositionLocal', 'tsl:PositionWorld', 'tsl:PositionView',
    'tsl:NormalLocal', 'tsl:NormalWorld', 'tsl:NormalView',
    'tsl:UV', 'tsl:Time', 'tsl:CameraPosition', 'tsl:VertexColor',
    'tsl:UniformFloat', 'tsl:UniformVec3', 'tsl:UniformColor',
    'tsl:SplitXYZ', 'tsl:CombineXYZ',
    'tsl:TextureSample',
    'tsl:MaterialOutput', 'tsl:PhysicalMaterialOutput',
  ];

  for (const type of pluginTypes) {
    describe(type, () => {
      const plugin = getPlugin(type);
      if (!plugin) { it.skip('plugin not registered', () => { /* skip */ }); return; }
      const def = plugin.def;

      it('build() populates outputVarMap for all outputs', () => {
        const node = makeNode({ id: 'n1', type, inputs: def.inputs.map(i => ({ ...i, value: i.defaultValue })), outputs: def.outputs.map(o => ({ ...o })) });
        const ctx = makeBuildCtx(node, def);
        plugin.build(ctx);
        for (const out of def.outputs) {
          if (out.id) {
            expect(ctx.outputVarMap.has(out.id) || ctx.materialNodes.length > 0).toBe(true);
          }
        }
      });

      it('export() generates output and/or lines', () => {
        const node = makeNode({ id: 'n1', type, inputs: def.inputs.map(i => ({ ...i, value: i.defaultValue })), outputs: def.outputs.map(o => ({ ...o })) });
        const ctx = makeExportCtx(node, def);
        plugin.export(ctx);
        if (def.isMaterial) {
          expect(ctx.materialNodes).toHaveLength(1);
        } else {
          const hasLines = ctx.lines.length > 0;
          const hasOutputs = def.outputs.every(o => ctx.outputVarMap.has(o.id));
          expect(hasLines || hasOutputs).toBe(true);
        }
      });

      it('def matches plugin type', () => {
        expect(plugin.def.type).toBe(type);
      });
    });
  }
});
