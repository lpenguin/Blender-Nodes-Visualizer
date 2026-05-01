import { vec3 } from 'three/tsl';
import { TSLNodePlugin } from '../tslHandlerContext';

export const CombineXYZPlugin: TSLNodePlugin = {
  type: 'tsl:CombineXYZ',
  def: {
    type: 'tsl:CombineXYZ',
    name: 'Combine XYZ',
    category: 'Vector',
    description: 'Compose a vec3 from X, Y, Z float values.',
    tslFn: 'vec3',
    inputs: [
      { id: 'x', name: 'X', type: 'float', defaultValue: 0.0 },
      { id: 'y', name: 'Y', type: 'float', defaultValue: 0.0 },
      { id: 'z', name: 'Z', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  build(ctx) {
    const xPort = ctx.node.inputs?.[0];
    const yPort = ctx.node.inputs?.[1];
    const zPort = ctx.node.inputs?.[2];
    const x = xPort ? ctx.getInputValue(xPort.id, xPort.type, xPort.value ?? 0) : ctx.formatDefault('float', 0);
    const y = yPort ? ctx.getInputValue(yPort.id, yPort.type, yPort.value ?? 0) : ctx.formatDefault('float', 0);
    const z = zPort ? ctx.getInputValue(zPort.id, zPort.type, zPort.value ?? 0) : ctx.formatDefault('float', 0);
    const result = vec3(x, y, z);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, result);
    }
  },
  export(ctx) {
    ctx.imports.add('vec3');
    const xPort = ctx.node.inputs?.[0];
    const yPort = ctx.node.inputs?.[1];
    const zPort = ctx.node.inputs?.[2];
    const xExpr = xPort ? ctx.getInputExpression(xPort.id, xPort.type, xPort.value ?? 0) : '0';
    const yExpr = yPort ? ctx.getInputExpression(yPort.id, yPort.type, yPort.value ?? 0) : '0';
    const zExpr = zPort ? ctx.getInputExpression(zPort.id, zPort.type, zPort.value ?? 0) : '0';
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = vec3(${xExpr}, ${yExpr}, ${zExpr});`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};
