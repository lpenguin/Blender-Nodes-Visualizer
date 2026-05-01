import { TSLNodePlugin, NodeBuildContext, NodeExportContext } from '../tslHandlerContext';

export const SplitXYZPlugin: TSLNodePlugin = {
  type: 'tsl:SplitXYZ',
  def: {
    type: 'tsl:SplitXYZ',
    name: 'Split XYZ',
    category: 'Vector',
    description: 'Decompose a vec3 into its X, Y, Z components.',
    tslFn: 'split',
    inputs: [
      { id: 'v', name: 'Vector', type: 'vec3' },
    ],
    outputs: [
      { id: 'x', name: 'X', type: 'float' },
      { id: 'y', name: 'Y', type: 'float' },
      { id: 'z', name: 'Z', type: 'float' },
    ],
  },
  build(ctx: NodeBuildContext): void {
    const inputPort = ctx.node.inputs?.[0];
     
    const inputValue = inputPort !== undefined
      ? ctx.getInputValue(inputPort.id, inputPort.type, null)
      : ctx.formatDefault('vec3', null);
    const outPorts = ctx.node.outputs ?? [];
    if (outPorts.length > 0) {
       
      ctx.outputVarMap.set(outPorts[0].id, inputValue.x);
    }
    if (outPorts.length > 1) {
       
      ctx.outputVarMap.set(outPorts[1].id, inputValue.y);
    }
    if (outPorts.length > 2) {
       
      ctx.outputVarMap.set(outPorts[2].id, inputValue.z);
    }
  },
  export(ctx: NodeExportContext): void {
    const inputPort = ctx.node.inputs?.[0];
    const inputExpr = inputPort !== undefined
      ? ctx.getInputExpression(inputPort.id, inputPort.type, null)
      : 'vec3(0, 0, 0)';
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${inputExpr};`);
    const outPorts = ctx.node.outputs ?? [];
    if (outPorts.length > 0) ctx.outputVarMap.set(outPorts[0].id, `${varName}.x`);
    if (outPorts.length > 1) ctx.outputVarMap.set(outPorts[1].id, `${varName}.y`);
    if (outPorts.length > 2) ctx.outputVarMap.set(outPorts[2].id, `${varName}.z`);
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};
