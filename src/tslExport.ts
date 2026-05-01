import { GraphSchema, NodeData, ConnectionData } from './types';
import { topoSort, sanitizeId } from './tslUtils';
import { getPlugin, TSL_NODE_BY_TYPE, NodeExportContext, TSLValue } from './handlers';
import './handlers';

function formatDefaultValue(type: string, value: TSLValue): string {
  if (value === null || value === 0) return '0';
  switch (type) {
    case 'float':
      return typeof value === 'number' ? value.toFixed(4) : String(value);
    case 'vec2':
      if (Array.isArray(value) && value.length >= 2)
        return `vec2(${value[0].toFixed(4)}, ${value[1].toFixed(4)})`;
      return 'vec2(0, 0)';
    case 'vec3':
      if (Array.isArray(value) && value.length >= 3)
        return `vec3(${value[0].toFixed(4)}, ${value[1].toFixed(4)}, ${value[2].toFixed(4)})`;
      return 'vec3(0, 0, 0)';
    case 'vec4':
      if (Array.isArray(value) && value.length >= 4)
        return `vec4(${value[0].toFixed(4)}, ${value[1].toFixed(4)}, ${value[2].toFixed(4)}, ${value[3].toFixed(4)})`;
      return 'vec4(0, 0, 0, 1)';
    case 'color':
      if (Array.isArray(value) && value.length >= 3)
        return `color(${value[0].toFixed(4)}, ${value[1].toFixed(4)}, ${value[2].toFixed(4)})`;
      return 'color(1, 1, 1)';
    default:
      return String(value);
  }
}

function getInputExpression(
  portId: string,
  portType: string,
  defaultValue: TSLValue,
  connections: ConnectionData[],
  outputVarMap: Map<string, string>,
): string {
  const conn = connections.find(c => c.to === portId);
  if (conn) {
    const varName = outputVarMap.get(conn.from);
    if (varName) return varName;
  }
  return formatDefaultValue(portType, defaultValue);
}

const GENERIC_TSL_FNS = new Set([
  'float', 'vec2', 'vec3', 'vec4', 'color',
  'add', 'sub', 'mul', 'div', 'abs', 'sin', 'cos', 'pow', 'sqrt',
  'clamp', 'mix', 'step', 'smoothstep', 'min', 'max',
  'fract', 'floor', 'ceil', 'round', 'mod', 'sign', 'log', 'exp',
  'dot', 'cross', 'normalize', 'length', 'distance', 'reflect', 'refract',
  'oneMinus', 'negate', 'reciprocal',
  'hue', 'saturation', 'luminance',
  'mx_cell_noise_float',
  'mx_worley_noise_float', 'mx_worley_noise_vec2', 'mx_worley_noise_vec3',
  'mx_fractal_noise_float', 'mx_fractal_noise_vec2', 'mx_fractal_noise_vec3', 'mx_fractal_noise_vec4',
  'mx_noise_float', 'mx_noise_vec3', 'mx_noise_vec4',
  'mx_unifiednoise2d', 'mx_unifiednoise3d',
  'triNoise3D', 'interleavedGradientNoise',
]);

export function exportTSL(schema: GraphSchema): string {
  const { nodes, connections } = schema;
  const sorted = topoSort(nodes, connections);
  const outputVarMap = new Map<string, string>();
  const nodeVarMap = new Map<string, string>();
  const lines: string[] = [];
  const imports = new Set<string>();
  const materialNodes: NodeData[] = [];

  for (const node of sorted) {
    const def = TSL_NODE_BY_TYPE.get(node.type);
    if (!def) {
      lines.push(`// [Unknown node] ${node.name} (${node.type})`);
      continue;
    }

    const plugin = getPlugin(node.type);
    if (plugin) {
      const ctx: NodeExportContext = {
        node,
        def,
        connections,
        outputVarMap,
        nodeVarMap,
        lines,
        imports,
        materialNodes,
        getInputExpression: (portId, portType, defaultValue) =>
          getInputExpression(portId, portType, defaultValue, connections, outputVarMap),
        formatDefaultValue,
        sanitizeId,
      };
      plugin.export(ctx);
      continue;
    }

    if (GENERIC_TSL_FNS.has(def.tslFn)) {
      imports.add(def.tslFn);
      const args = (node.inputs ?? []).map((port, i) => {
        const portDef = def.inputs[i];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return getInputExpression(port.id, port.type, port.value ?? portDef.defaultValue ?? 0, connections, outputVarMap);
      });
      const callExpr = `${def.tslFn}(${args.join(', ')})`;
      const varName = sanitizeId(node.id);
      lines.push(`const ${varName} = ${callExpr};`);
      const outPorts = node.outputs ?? [];
      if (outPorts.length === 1) {
        outputVarMap.set(outPorts[0].id, varName);
      } else {
        for (let i = 0; i < outPorts.length; i++) {
          outputVarMap.set(outPorts[i].id, `${varName}[${String(i)}]`);
        }
      }
      nodeVarMap.set(node.id, varName);
    }
  }

  for (const matNode of materialNodes) {
    const def = TSL_NODE_BY_TYPE.get(matNode.type);
    if (!def) continue;
    const matVarName = sanitizeId(matNode.id);
    lines.push('');
    lines.push(`const ${matVarName} = new ${def.tslFn}();`);

    const inputs = matNode.inputs ?? [];
    for (let i = 0; i < inputs.length; i++) {
      const inputPort = inputs[i];
      const catalogPortId = def.inputs[i]?.id ?? inputPort.id;
      const conn = connections.find(c => c.to === inputPort.id);
      if (conn) {
        const sourceExpr = outputVarMap.get(conn.from);
        if (sourceExpr) {
          lines.push(`${matVarName}.${catalogPortId} = ${sourceExpr};`);
        }
      }
    }
  }

  const importList = Array.from(imports).sort();
  const importLine = importList.length > 0
    ? `import { ${importList.join(', ')} } from 'three/tsl';`
    : `// No TSL imports needed`;
  const importTHREE = `import * as THREE from 'three';`;

  const header = [
    '// Generated by Three.js TSL Node Editor',
    '// https://github.com/mrdoob/three.js',
    '',
    importTHREE,
    importLine,
    '',
  ];

  return [...header, ...lines].join('\n');
}
