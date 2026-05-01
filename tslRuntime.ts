import * as THREE from 'three';
import {
  uv, time, sin, cos, color, mix, add, sub, mul, div, abs, pow, sqrt, clamp,
  step, smoothstep, min, max, fract, floor, ceil, round, mod, sign, log, exp,
  dot, cross, normalize, length, distance, reflect, refract,
  oneMinus, negate, reciprocal, float, vec2, vec3, vec4, uniform, texture,
  positionLocal, positionWorld, positionView,
  normalLocal, normalWorld, normalView,
  cameraPosition, vertexColor,
  hue, saturation, luminance,
} from 'three/tsl';
import {
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
} from 'three/webgpu';
import { GraphSchema, NodeData, ConnectionData } from './types';
import { TSL_NODE_BY_TYPE } from './tslNodes';

type TSLNode = any;

const TSL_FNS: Record<string, (...args: any[]) => TSLNode> = {
  float, vec2, vec3, vec4, color,
  add, sub, mul, div, abs, sin, cos, pow, sqrt,
  clamp, mix, step, smoothstep, min, max,
  fract, floor, ceil, round, mod, sign, log, exp,
  dot, cross, normalize, length, distance, reflect, refract,
  oneMinus, negate, reciprocal,
  hue, saturation, luminance,
  uniform, texture,
};

function topoSort(nodes: NodeData[], connections: ConnectionData[]): NodeData[] {
  const portToNode = new Map<string, string>();
  for (const node of nodes) {
    for (const p of node.inputs ?? []) portToNode.set(p.id, node.id);
    for (const p of node.outputs ?? []) portToNode.set(p.id, node.id);
  }
  const deps = new Map<string, Set<string>>();
  for (const node of nodes) deps.set(node.id, new Set());
  for (const conn of connections) {
    const fromNode = portToNode.get(conn.from);
    const toNode = portToNode.get(conn.to);
    if (fromNode && toNode && fromNode !== toNode) {
      deps.get(toNode)?.add(fromNode);
    }
  }
  const visited = new Set<string>();
  const result: NodeData[] = [];
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dep of deps.get(id) ?? []) visit(dep);
    const node = nodes.find(n => n.id === id);
    if (node) result.push(node);
  }
  for (const node of nodes) visit(node.id);
  return result;
}

function formatDefault(type: string, value: any): TSLNode {
  if (value === undefined || value === null) return float(0);
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
  defaultValue: any,
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
  defaultValue: any,
  connections: ConnectionData[],
  outputVarMap: Map<string, TSLNode>,
): any {
  const conn = connections.find(c => c.to === portId);
  if (conn) {
    const value = outputVarMap.get(conn.from);
    if (value !== undefined) return value;
  }
  return defaultValue;
}

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

const BUILTIN_SOURCES: Record<string, TSLNode> = {
  'tsl:PositionLocal': positionLocal,
  'tsl:PositionWorld': positionWorld,
  'tsl:PositionView': positionView,
  'tsl:NormalLocal': normalLocal,
  'tsl:NormalWorld': normalWorld,
  'tsl:NormalView': normalView,
  'tsl:UV': uv(),
  'tsl:Time': time,
  'tsl:CameraPosition': cameraPosition,
  'tsl:VertexColor': vertexColor(),
};

const UNIFORM_TYPES = new Set(['tsl:UniformFloat', 'tsl:UniformVec3', 'tsl:UniformColor']);

export function buildTSLMaterial(schema: GraphSchema): MeshStandardNodeMaterial | MeshPhysicalNodeMaterial | null {
  try {
    const { nodes, connections } = schema;
    const sorted = topoSort(nodes, connections);
    const outputVarMap = new Map<string, TSLNode>();
    const materialNodes: NodeData[] = [];

    for (const node of sorted) {
      const def = TSL_NODE_BY_TYPE.get(node.type);
      if (!def) continue;

      if (BUILTIN_SOURCES[node.type] !== undefined) {
        const value = BUILTIN_SOURCES[node.type];
        for (const out of node.outputs ?? []) {
          outputVarMap.set(out.id, value);
        }
        continue;
      }

      if (def.isMaterial) {
        materialNodes.push(node);
        continue;
      }

      if (node.type === 'tsl:SplitXYZ') {
        const inputPort = node.inputs?.[0];
        const inputValue = inputPort
          ? getInputValue(inputPort.id, inputPort.type, undefined, connections, outputVarMap)
          : vec3(0, 0, 0);
        const outPorts = node.outputs ?? [];
        if (outPorts[0]) outputVarMap.set(outPorts[0].id, inputValue.x);
        if (outPorts[1]) outputVarMap.set(outPorts[1].id, inputValue.y);
        if (outPorts[2]) outputVarMap.set(outPorts[2].id, inputValue.z);
        continue;
      }

      if (node.type === 'tsl:TextureSample') {
        const uvIdx = def.inputs.findIndex(d => d.id === 'uv');
        const uvPort = uvIdx >= 0 ? node.inputs?.[uvIdx] : undefined;
        const uvValue = uvPort
          ? getInputValue(uvPort.id, 'vec2', undefined, connections, outputVarMap)
          : uv();
        const texResult = texture(getPlaceholderTexture(), uvValue);
        const outPorts = node.outputs ?? [];
        if (outPorts[0]) outputVarMap.set(outPorts[0].id, texResult);
        if (outPorts[1]) outputVarMap.set(outPorts[1].id, texResult.rgb);
        if (outPorts[2]) outputVarMap.set(outPorts[2].id, texResult.a);
        continue;
      }

      if (UNIFORM_TYPES.has(node.type)) {
        const inputPort = node.inputs?.[0];
        const initVal = inputPort?.value;
        let uniformValue: TSLNode;
        if (node.type === 'tsl:UniformFloat') {
          uniformValue = uniform(typeof initVal === 'number' ? initVal : 0);
        } else if (node.type === 'tsl:UniformVec3') {
          const raw = Array.isArray(initVal) ? initVal : [0, 0, 0];
          uniformValue = uniform(new THREE.Vector3(raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0));
        } else {
          const raw = Array.isArray(initVal) ? initVal : [1, 1, 1];
          uniformValue = uniform(new THREE.Color(raw[0] ?? 1, raw[1] ?? 1, raw[2] ?? 1));
        }
        for (const out of node.outputs ?? []) {
          outputVarMap.set(out.id, uniformValue);
        }
        continue;
      }

      if (def.isSource) {
        const tslFn = TSL_FNS[def.tslFn];
        if (!tslFn) continue;
        const args = (node.inputs ?? []).map((port, i) => {
          const portDef = def.inputs[i];
          return getInputRaw(port.id, port.value ?? portDef?.defaultValue, connections, outputVarMap);
        });
        const flatArgs = args.flatMap(a => Array.isArray(a) ? a : [a]);
        const result = tslFn(...flatArgs);
        for (const out of node.outputs ?? []) {
          outputVarMap.set(out.id, result);
        }
        continue;
      }

      const tslFn = TSL_FNS[def.tslFn];
      if (!tslFn) continue;

      const args = (node.inputs ?? []).map((port, i) => {
        const portDef = def.inputs[i];
        return getInputValue(port.id, port.type, port.value ?? portDef?.defaultValue, connections, outputVarMap);
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
      const def = TSL_NODE_BY_TYPE.get(matNode.type)!;
      const material = def.tslFn === 'MeshPhysicalNodeMaterial'
        ? new MeshPhysicalNodeMaterial()
        : new MeshStandardNodeMaterial();

      for (let i = 0; i < (matNode.inputs ?? []).length; i++) {
        const inputPort = matNode.inputs![i];
        const catalogPortId = def.inputs[i]?.id ?? inputPort.id;
        const conn = connections.find(c => c.to === inputPort.id);
        if (conn) {
          const sourceValue = outputVarMap.get(conn.from);
          if (sourceValue !== undefined) {
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
