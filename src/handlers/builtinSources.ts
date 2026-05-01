import {
  uv, time,
  positionLocal, positionWorld, positionView,
  normalLocal, normalWorld, normalView,
  cameraPosition, vertexColor,
} from 'three/tsl';
import { TSLNodePlugin, TSLNodeDef, NodeBuildContext, NodeExportContext } from '../tslHandlerContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

const SOURCES: Record<string, { node: TSLNode; expr: string; def: TSLNodeDef }> = {
  'tsl:PositionLocal': {
    node: positionLocal,
    expr: 'positionLocal',
    def: {
      type: 'tsl:PositionLocal',
      name: 'Position (Local)',
      category: 'Built-in',
      description: 'Vertex position in local/object space.',
      tslFn: 'positionLocal',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Position', type: 'vec3' }],
    },
  },
  'tsl:PositionWorld': {
    node: positionWorld,
    expr: 'positionWorld',
    def: {
      type: 'tsl:PositionWorld',
      name: 'Position (World)',
      category: 'Built-in',
      description: 'Vertex position in world space.',
      tslFn: 'positionWorld',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Position', type: 'vec3' }],
    },
  },
  'tsl:PositionView': {
    node: positionView,
    expr: 'positionView',
    def: {
      type: 'tsl:PositionView',
      name: 'Position (View)',
      category: 'Built-in',
      description: 'Vertex position in view/camera space.',
      tslFn: 'positionView',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Position', type: 'vec3' }],
    },
  },
  'tsl:NormalLocal': {
    node: normalLocal,
    expr: 'normalLocal',
    def: {
      type: 'tsl:NormalLocal',
      name: 'Normal (Local)',
      category: 'Built-in',
      description: 'Vertex normal in local/object space.',
      tslFn: 'normalLocal',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Normal', type: 'vec3' }],
    },
  },
  'tsl:NormalWorld': {
    node: normalWorld,
    expr: 'normalWorld',
    def: {
      type: 'tsl:NormalWorld',
      name: 'Normal (World)',
      category: 'Built-in',
      description: 'Vertex normal in world space.',
      tslFn: 'normalWorld',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Normal', type: 'vec3' }],
    },
  },
  'tsl:NormalView': {
    node: normalView,
    expr: 'normalView',
    def: {
      type: 'tsl:NormalView',
      name: 'Normal (View)',
      category: 'Built-in',
      description: 'Vertex normal in view/camera space.',
      tslFn: 'normalView',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Normal', type: 'vec3' }],
    },
  },
  'tsl:UV': {
    node: uv(),
    expr: 'uv()',
    def: {
      type: 'tsl:UV',
      name: 'UV',
      category: 'Built-in',
      description: 'Texture coordinates (uv channel 0).',
      tslFn: 'uv',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'UV', type: 'vec2' }],
    },
  },
  'tsl:Time': {
    node: time,
    expr: 'time',
    def: {
      type: 'tsl:Time',
      name: 'Time',
      category: 'Built-in',
      description: 'Elapsed time in seconds.',
      tslFn: 'time',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Time', type: 'float' }],
    },
  },
  'tsl:CameraPosition': {
    node: cameraPosition,
    expr: 'cameraPosition',
    def: {
      type: 'tsl:CameraPosition',
      name: 'Camera Position',
      category: 'Built-in',
      description: 'Camera position in world space.',
      tslFn: 'cameraPosition',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Position', type: 'vec3' }],
    },
  },
  'tsl:VertexColor': {
    node: vertexColor(),
    expr: 'vertexColor()',
    def: {
      type: 'tsl:VertexColor',
      name: 'Vertex Color',
      category: 'Built-in',
      description: 'Per-vertex color attribute.',
      tslFn: 'vertexColor',
      isSource: true,
      inputs: [],
      outputs: [{ id: 'out', name: 'Color', type: 'color' }],
    },
  },
};

export const builtinPlugins: TSLNodePlugin[] = Object.entries(SOURCES).map(([type, src]) => ({
  type,
  def: src.def,
  build(ctx: NodeBuildContext): void {
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, src.node);
    }
  },
  export(ctx: NodeExportContext): void {
    const fn = src.expr.replace('()', '');
    ctx.imports.add(fn);
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${src.expr};`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
}));
