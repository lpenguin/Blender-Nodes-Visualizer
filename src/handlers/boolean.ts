import { TSLNodePlugin, NodeBuildContext, NodeExportContext } from '../tslHandlerContext';

export const BooleanNodePlugin: TSLNodePlugin = {
  type: 'tsl:BooleanNode',
  def: {
    type: 'tsl:BooleanNode',
    name: 'Boolean',
    category: 'Inputs',
    description: 'A constant boolean value.',
    tslFn: 'boolean',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Value', type: 'boolean', defaultValue: false },
    ],
    outputs: [
      { id: 'out', name: 'Boolean', type: 'boolean' },
    ],
  },
  build(ctx: NodeBuildContext): void {
    const value = ctx.node.inputs?.[0]?.value === true;
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, value);
    }
  },
  export(ctx: NodeExportContext): void {
    const value = ctx.node.inputs?.[0]?.value === true;
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${value ? 'true' : 'false'};`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};
