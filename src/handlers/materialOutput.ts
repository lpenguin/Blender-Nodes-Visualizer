import { TSLNodePlugin, NodeBuildContext, NodeExportContext } from '../tslHandlerContext';

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
      { id: 'colorNode', name: 'Color', type: 'color', defaultValue: [1, 1, 1] },
      { id: 'roughnessNode', name: 'Roughness', type: 'float', defaultValue: 0.5, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'metalnessNode', name: 'Metalness', type: 'float', defaultValue: 0, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'emissiveNode', name: 'Emissive', type: 'color', defaultValue: [1, 1, 1] },
      { id: 'emissiveIntensityNode', name: 'Emissive Strength', type: 'float', defaultValue: 0 },
      { id: 'normalNode', name: 'Normal', type: 'vec3' },
      { id: 'opacityNode', name: 'Opacity', type: 'float', defaultValue: 1, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'transparent', name: 'Transparent', type: 'boolean', defaultValue: false },
      { id: 'positionNode', name: 'Position', type: 'vec3' },
    ],
    outputs: [],
  },
  build(ctx: NodeBuildContext): void {
    ctx.materialNodes.push(ctx.node);
  },
  export(ctx: NodeExportContext): void {
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
      { id: 'colorNode', name: 'Color', type: 'color', defaultValue: [1, 1, 1] },
      { id: 'roughnessNode', name: 'Roughness', type: 'float', defaultValue: 0.5, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'metalnessNode', name: 'Metalness', type: 'float', defaultValue: 0, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'emissiveNode', name: 'Emissive', type: 'color', defaultValue: [1, 1, 1] },
      { id: 'emissiveIntensityNode', name: 'Emissive Strength', type: 'float', defaultValue: 0 },
      { id: 'normalNode', name: 'Normal', type: 'vec3' },
      { id: 'opacityNode', name: 'Opacity', type: 'float', defaultValue: 1, range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'transparent', name: 'Transparent', type: 'boolean', defaultValue: false },
      { id: 'clearcoatNode', name: 'Clearcoat', type: 'float', range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
      { id: 'transmissionNode', name: 'Transmission', type: 'float', range: { min: 0, max: 1, step: 0.01, fineStep: 0.001 } },
    ],
    outputs: [],
  },
  build(ctx: NodeBuildContext): void {
    ctx.materialNodes.push(ctx.node);
  },
  export(ctx: NodeExportContext): void {
    ctx.materialNodes.push(ctx.node);
  },
};
