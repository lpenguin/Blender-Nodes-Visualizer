import * as THREE from 'three';
import { texture, uv as uvFn } from 'three/tsl';
import { TSLNodePlugin, NodeBuildContext, NodeExportContext } from '../tslHandlerContext';

let placeholderTexture: THREE.DataTexture | null = null;
function getPlaceholderTexture(): THREE.DataTexture {
  if (placeholderTexture) return placeholderTexture;
  const size = 4;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const checker = (x + y) % 2 === 0;
    data[i * 4] = checker ? 255 : 200;
    data[i * 4 + 1] = checker ? 200 : 128;
    data[i * 4 + 2] = checker ? 128 : 255;
    data[i * 4 + 3] = 255;
  }
  placeholderTexture = new THREE.DataTexture(data, size, size);
  placeholderTexture.needsUpdate = true;
  return placeholderTexture;
}

export const TextureSamplePlugin: TSLNodePlugin = {
  type: 'tsl:TextureSample',
  def: {
    type: 'tsl:TextureSample',
    name: 'Texture Sample',
    category: 'Texture',
    description: 'Sample a 2D texture at UV coordinates.',
    tslFn: 'texture',
    isSource: true,
    inputs: [
      { id: 'uv', name: 'UV', type: 'vec2' },
    ],
    outputs: [
      { id: 'rgba', name: 'RGBA', type: 'vec4' },
      { id: 'rgb', name: 'RGB', type: 'color' },
      { id: 'a', name: 'Alpha', type: 'float' },
    ],
  },
  build(ctx: NodeBuildContext): void {
    const uvIdx = ctx.def.inputs.findIndex(d => d.id === 'uv');
    const uvPort = uvIdx >= 0 ? ctx.node.inputs?.[uvIdx] : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const uvValue = uvPort !== undefined
      ? ctx.getInputValue(uvPort.id, 'vec2', null)
      : uvFn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const texResult = texture(getPlaceholderTexture(), uvValue);
    const outPorts = ctx.node.outputs ?? [];
    if (outPorts[0] !== undefined) ctx.outputVarMap.set(outPorts[0].id, texResult);
    if (outPorts[1] !== undefined) ctx.outputVarMap.set(outPorts[1].id, texResult.rgb);
    if (outPorts[2] !== undefined) ctx.outputVarMap.set(outPorts[2].id, texResult.a);
  },
  export(ctx: NodeExportContext): void {
    ctx.imports.add('texture');
    const uvIdx = ctx.def.inputs.findIndex(d => d.id === 'uv');
    const uvPort = uvIdx >= 0 ? ctx.node.inputs?.[uvIdx] : undefined;
    const uvExpr = uvPort !== undefined
      ? ctx.getInputExpression(uvPort.id, 'vec2', null)
      : 'uv()';
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = texture(myTexture, ${uvExpr});`);
    const outPorts = ctx.node.outputs ?? [];
    if (outPorts[0] !== undefined) ctx.outputVarMap.set(outPorts[0].id, varName);
    if (outPorts[1] !== undefined) ctx.outputVarMap.set(outPorts[1].id, `${varName}.rgb`);
    if (outPorts[2] !== undefined) ctx.outputVarMap.set(outPorts[2].id, `${varName}.a`);
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};
