import {
  sin, cos, color, mix, add, sub, mul, div, abs, pow, sqrt, clamp,
  step, smoothstep, min, max, fract, floor, ceil, round, mod, sign, log, exp,
  dot, cross, normalize, length, distance, reflect, refract,
  oneMinus, negate, reciprocal, float, vec2, vec3, vec4, uniform, texture,
  hue, saturation, luminance,
  mx_cell_noise_float,
  mx_worley_noise_float, mx_worley_noise_vec2, mx_worley_noise_vec3,
  mx_fractal_noise_float, mx_fractal_noise_vec2, mx_fractal_noise_vec3, mx_fractal_noise_vec4,
  mx_noise_float, mx_noise_vec3, mx_noise_vec4,
  mx_unifiednoise2d, mx_unifiednoise3d,
  triNoise3D, interleavedGradientNoise,
} from 'three/tsl';
import {
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
} from 'three/webgpu';
import { GraphSchema, NodeData, ConnectionData } from './types';
import { topoSort } from './tslUtils';
import { getPlugin, TSL_NODE_BY_TYPE, NodeBuildContext, TSLValue } from './handlers';
import './handlers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSL_FNS: Record<string, (...args: any[]) => TSLNode> = {
  float, vec2, vec3, vec4, color,
  add, sub, mul, div, abs, sin, cos, pow, sqrt,
  clamp, mix, step, smoothstep, min, max,
  fract, floor, ceil, round, mod, sign, log, exp,
  dot, cross, normalize, length, distance, reflect, refract,
  oneMinus, negate, reciprocal,
  hue, saturation, luminance,
  uniform, texture,
  mx_cell_noise_float,
  mx_worley_noise_float, mx_worley_noise_vec2, mx_worley_noise_vec3,
  mx_fractal_noise_float, mx_fractal_noise_vec2, mx_fractal_noise_vec3, mx_fractal_noise_vec4,
  mx_noise_float, mx_noise_vec3, mx_noise_vec4,
  mx_unifiednoise2d, mx_unifiednoise3d,
  triNoise3D, interleavedGradientNoise,
};

function formatDefault(type: string, value: TSLValue): TSLNode {
  if (value === null) return float(0);
  switch (type) {
    case 'float': return float(typeof value === 'number' ? value : 0);
    case 'vec2': {
      const v = Array.isArray(value) ? value : [0, 0];
      return vec2(v[0] ?? 0, v[1] ?? 0);
    }
    case 'vec3': {
      const v = Array.isArray(value) ? value : [0, 0, 0];
      return vec3(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
    }
    case 'vec4': {
      const v = Array.isArray(value) ? value : [0, 0, 0, 1];
      return vec4(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 1);
    }
    case 'color': {
      const v = Array.isArray(value) ? value : [1, 1, 1];
      return color(v[0] ?? 1, v[1] ?? 1, v[2] ?? 1);
    }
    default: return float(0);
  }
}

function getInputValue(
  portId: string,
  portType: string,
  defaultValue: TSLValue,
  connections: ConnectionData[],
  outputVarMap: Map<string, TSLNode>,
): TSLNode {
    const conn = connections.find(c => c.to === portId);
    if (conn) {
       
      const value = outputVarMap.get(conn.from);
      if (value !== undefined) return value;
    }
    return formatDefault(portType, defaultValue);
  }

  function getInputRaw(
    portId: string,
    defaultValue: TSLValue,
    connections: ConnectionData[],
    outputVarMap: Map<string, TSLNode>,
  ): TSLNode {
    const conn = connections.find(c => c.to === portId);
    if (conn) {
       
      const value = outputVarMap.get(conn.from);
      if (value !== undefined) return value;
    }
  return defaultValue;
}

export function buildTSLMaterial(schema: GraphSchema): MeshStandardNodeMaterial | MeshPhysicalNodeMaterial | null {
  try {
    const { nodes, connections } = schema;
    const sorted = topoSort(nodes, connections);
    const outputVarMap = new Map<string, TSLNode>();
    const materialNodes: NodeData[] = [];

    for (const node of sorted) {
      const def = TSL_NODE_BY_TYPE.get(node.type);
      if (!def) continue;

      const plugin = getPlugin(node.type);
      if (plugin) {
        const ctx: NodeBuildContext = {
          node,
          def,
          connections,
          outputVarMap,
          materialNodes,
          getInputValue: (portId: string, portType: string, defaultValue: TSLValue): TSLNode =>
             
            getInputValue(portId, portType, defaultValue, connections, outputVarMap),
          getInputRaw: (portId: string, defaultValue: TSLValue): TSLNode =>
             
            getInputRaw(portId, defaultValue, connections, outputVarMap),
          formatDefault,
        };
        plugin.build(ctx);
        continue;
      }

      const tslFn = TSL_FNS[def.tslFn];

      if (def.isSource) {
        const args = (node.inputs ?? []).map((port, i) => {
          const portDef = def.inputs[i];
           
          return getInputRaw(port.id, port.value ?? portDef.defaultValue ?? 0, connections, outputVarMap);
        });
         
        const flatArgs = args.flatMap((a): TSLNode[] => Array.isArray(a) ? a : [a]);
         
        const result = tslFn(...flatArgs);
        for (const out of node.outputs ?? []) {
          outputVarMap.set(out.id, result);
        }
        continue;
      }

      const args = (node.inputs ?? []).map((port, i) => {
        const portDef = def.inputs[i];
         
        return getInputValue(port.id, port.type, port.value ?? portDef.defaultValue ?? 0, connections, outputVarMap);
      });

       
      const result = tslFn(...args);
      const outPorts = node.outputs ?? [];
      if (outPorts.length === 1) {
        outputVarMap.set(outPorts[0].id, result);
      } else {
        for (let i = 0; i < outPorts.length; i++) {
           
          outputVarMap.set(outPorts[i].id, result[i]);
        }
      }
    }

    for (const matNode of materialNodes) {
      const def = TSL_NODE_BY_TYPE.get(matNode.type);
      if (!def) continue;
      const material = def.tslFn === 'MeshPhysicalNodeMaterial'
        ? new MeshPhysicalNodeMaterial()
        : new MeshStandardNodeMaterial();

      const matInputs = matNode.inputs ?? [];
      for (let i = 0; i < matInputs.length; i++) {
        const inputPort = matInputs[i];
        const catalogPortId = def.inputs[i]?.id ?? inputPort.id;
        const conn = connections.find(c => c.to === inputPort.id);
        if (conn) {
           
          const sourceValue = outputVarMap.get(conn.from);
          if (sourceValue !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (material as any)[catalogPortId] = sourceValue;
          }
        }
      }

      return material;
    }

    return null;
  } catch (err) {
    console.warn('TSL runtime build failed:', err);
    return null;
  }
}
