import { TSLNodePlugin } from '../tslHandlerContext';

export const MaterialOutputPlugin: TSLNodePlugin = {
  type: 'tsl:MaterialOutput',
  def: {
    type: 'tsl:MaterialOutput',
    name: 'Material Output',
    category: 'Output',
    description: 'MeshStandardNodeMaterial output. Connect nodes to colorNode, roughnessNode, metalnessNode, etc.',
    tslFn: 'MeshStandardNodeMaterial',
    isMaterial: true,
    inputs: [
      { id: 'colorNode', name: 'Color', type: 'color' },
      { id: 'roughnessNode', name: 'Roughness', type: 'float' },
      { id: 'metalnessNode', name: 'Metalness', type: 'float' },
      { id: 'emissiveNode', name: 'Emissive', type: 'color' },
      { id: 'normalNode', name: 'Normal', type: 'vec3' },
      { id: 'opacityNode', name: 'Opacity', type: 'float' },
      { id: 'positionNode', name: 'Position', type: 'vec3' },
    ],
    outputs: [],
  },
  build(ctx) {
    ctx.materialNodes.push(ctx.node);
  },
  export(ctx) {
    ctx.materialNodes.push(ctx.node);
  },
};

export const PhysicalMaterialOutputPlugin: TSLNodePlugin = {
  type: 'tsl:PhysicalMaterialOutput',
  def: {
    type: 'tsl:PhysicalMaterialOutput',
    name: 'Physical Material Output',
    category: 'Output',
    description: 'MeshPhysicalNodeMaterial output.',
    tslFn: 'MeshPhysicalNodeMaterial',
    isMaterial: true,
    inputs: [
      { id: 'colorNode', name: 'Color', type: 'color' },
      { id: 'roughnessNode', name: 'Roughness', type: 'float' },
      { id: 'metalnessNode', name: 'Metalness', type: 'float' },
      { id: 'emissiveNode', name: 'Emissive', type: 'color' },
      { id: 'normalNode', name: 'Normal', type: 'vec3' },
      { id: 'opacityNode', name: 'Opacity', type: 'float' },
      { id: 'clearcoatNode', name: 'Clearcoat', type: 'float' },
      { id: 'transmissionNode', name: 'Transmission', type: 'float' },
    ],
    outputs: [],
  },
  build(ctx) {
    ctx.materialNodes.push(ctx.node);
  },
  export(ctx) {
    ctx.materialNodes.push(ctx.node);
  },
};
