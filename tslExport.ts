
import { GraphSchema, NodeData, ConnectionData } from './types';
import { TSL_NODE_BY_TYPE } from './tslNodes';

// ─── Topological Sort ─────────────────────────────────────────────────────────

function topoSort(nodes: NodeData[], connections: ConnectionData[]): NodeData[] {
  // Build adjacency: portId → nodeId
  const portToNode = new Map<string, string>();
  for (const node of nodes) {
    for (const p of node.inputs ?? []) portToNode.set(p.id, node.id);
    for (const p of node.outputs ?? []) portToNode.set(p.id, node.id);
  }

  // Build edges: fromNodeId → Set<toNodeId>
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
    for (const dep of deps.get(id) ?? []) {
      visit(dep);
    }
    const node = nodes.find(n => n.id === id);
    if (node) result.push(node);
  }

  for (const node of nodes) visit(node.id);
  return result;
}

// ─── Code Generation ──────────────────────────────────────────────────────────

function sanitizeId(id: string): string {
  // Make a safe JS variable name; prefix with underscore if it starts with a digit
  const safe = id.replace(/[^a-zA-Z0-9_$]/g, '_');
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
}

function formatDefaultValue(type: string, value: any): string {
  if (value === undefined || value === null) return '0';

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
  defaultValue: any,
  connections: ConnectionData[],
  outputVarMap: Map<string, string>  // outputPortId → varName
): string {
  // Find a connection that targets this input port
  const conn = connections.find(c => c.to === portId);
  if (conn) {
    const varName = outputVarMap.get(conn.from);
    if (varName) return varName;
  }
  // Fall back to default value
  return formatDefaultValue(portType, defaultValue);
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export function exportTSL(schema: GraphSchema): string {
  const { nodes, connections } = schema;

  const sorted = topoSort(nodes, connections);

  // Map: outputPortId → JS variable expression for that output
  const outputVarMap = new Map<string, string>();

  // Map: nodeId → variable name (for single-output nodes the output var)
  const nodeVarMap = new Map<string, string>();

  const lines: string[] = [];
  const imports = new Set<string>();
  const materialAssignments: string[] = [];

  // Collect material-related TSL class names for imports
  const materialNodes: NodeData[] = [];

  for (const node of sorted) {
    const def = TSL_NODE_BY_TYPE.get(node.type);
    const varBase = sanitizeId(node.id);

    if (!def) {
      // Unknown node type — emit a comment placeholder
      lines.push(`// [Unknown node] ${node.name} (${node.type})`);
      continue;
    }

    // ── Source nodes (built-ins with no function call needed) ──
    const builtinSources: Record<string, string> = {
      'tsl:PositionLocal': 'positionLocal',
      'tsl:PositionWorld': 'positionWorld',
      'tsl:PositionView': 'positionView',
      'tsl:NormalLocal': 'normalLocal',
      'tsl:NormalWorld': 'normalWorld',
      'tsl:NormalView': 'normalView',
      'tsl:UV': 'uv()',
      'tsl:Time': 'time',
      'tsl:CameraPosition': 'cameraPosition',
      'tsl:VertexColor': 'vertexColor()',
    };

    if (builtinSources[node.type]) {
      const expr = builtinSources[node.type];
      const builtinFn = expr.replace('()', '');
      imports.add(builtinFn);
      const varName = `${varBase}`;
      lines.push(`const ${varName} = ${expr};`);
      // Map the (single) output port
      for (const out of def.outputs) {
        outputVarMap.set(out.id, varName);
      }
      nodeVarMap.set(node.id, varName);
      continue;
    }

    // ── Material output node ──
    if (def.isMaterial) {
      materialNodes.push(node);
      imports.add(def.tslFn);
      continue;
    }

    // ── SplitXYZ special case ──
    if (node.type === 'tsl:SplitXYZ') {
      const inputPort = node.inputs?.[0];
      const inputExpr = inputPort
        ? getInputExpression(inputPort.id, inputPort.type, undefined, connections, outputVarMap)
        : 'vec3(0, 0, 0)';
      const varName = varBase;
      lines.push(`const ${varName} = ${inputExpr};`);
      outputVarMap.set(`${node.id}_x`, `${varName}.x`);
      outputVarMap.set(`${node.id}_y`, `${varName}.y`);
      outputVarMap.set(`${node.id}_z`, `${varName}.z`);
      // Map output ports by position
      const outPorts = def.outputs;
      if (outPorts[0]) outputVarMap.set(outPorts[0].id, `${varName}.x`);
      if (outPorts[1]) outputVarMap.set(outPorts[1].id, `${varName}.y`);
      if (outPorts[2]) outputVarMap.set(outPorts[2].id, `${varName}.z`);
      nodeVarMap.set(node.id, varName);
      continue;
    }

    // ── TextureSample special case ──
    if (node.type === 'tsl:TextureSample') {
      imports.add('texture');
      const uvPort = node.inputs?.find(p => p.id === 'uv');
      const uvExpr = uvPort
        ? getInputExpression(uvPort.id, 'vec2', undefined, connections, outputVarMap)
        : 'uv()';
      const varName = `${varBase}`;
      lines.push(`const ${varName} = texture(myTexture, ${uvExpr});`);
      const outPorts = def.outputs;
      if (outPorts[0]) outputVarMap.set(outPorts[0].id, varName);
      if (outPorts[1]) outputVarMap.set(outPorts[1].id, `${varName}.rgb`);
      if (outPorts[2]) outputVarMap.set(outPorts[2].id, `${varName}.a`);
      nodeVarMap.set(node.id, varName);
      continue;
    }

    // ── Uniform nodes ──
    if (node.type === 'tsl:UniformFloat' || node.type === 'tsl:UniformVec3' || node.type === 'tsl:UniformColor') {
      imports.add('uniform');
      const inputPort = node.inputs?.[0];
      const initVal = inputPort?.value;
      let uniformExpr = '';
      if (node.type === 'tsl:UniformFloat') {
        uniformExpr = `uniform(${typeof initVal === 'number' ? initVal.toFixed(4) : '0.0'})`;
      } else if (node.type === 'tsl:UniformVec3') {
        imports.add('vec3');
        const raw = Array.isArray(initVal) ? initVal : [0, 0, 0];
        const v = [raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0];
        uniformExpr = `uniform(new THREE.Vector3(${v[0]}, ${v[1]}, ${v[2]}))`;
      } else {
        imports.add('color');
        const raw = Array.isArray(initVal) ? initVal : [1, 1, 1];
        const v = [raw[0] ?? 1, raw[1] ?? 1, raw[2] ?? 1];
        uniformExpr = `uniform(new THREE.Color(${v[0]}, ${v[1]}, ${v[2]}))`;
      }
      const varName = varBase;
      lines.push(`const ${varName} = ${uniformExpr};`);
      for (const out of def.outputs) {
        outputVarMap.set(out.id, varName);
      }
      nodeVarMap.set(node.id, varName);
      continue;
    }

    // ── Generic function nodes ──
    imports.add(def.tslFn);

    const args = (node.inputs ?? []).map(port => {
      const portDef = def.inputs.find(d => d.id === port.id);
      return getInputExpression(port.id, port.type, port.value ?? portDef?.defaultValue, connections, outputVarMap);
    });

    const callExpr = `${def.tslFn}(${args.join(', ')})`;
    const varName = varBase;
    lines.push(`const ${varName} = ${callExpr};`);

    // Map output ports
    if (def.outputs.length === 1) {
      outputVarMap.set(def.outputs[0].id, varName);
    } else {
      for (let i = 0; i < def.outputs.length; i++) {
        outputVarMap.set(def.outputs[i].id, `${varName}[${i}]`);
      }
    }
    nodeVarMap.set(node.id, varName);
  }

  // ── Material output assignments ──
  for (const matNode of materialNodes) {
    const def = TSL_NODE_BY_TYPE.get(matNode.type)!;
    const matVarName = `${sanitizeId(matNode.id)}`;
    lines.push('');
    lines.push(`const ${matVarName} = new ${def.tslFn}();`);

    for (const inputPort of matNode.inputs ?? []) {
      const conn = connections.find(c => c.to === inputPort.id);
      if (conn) {
        const sourceExpr = outputVarMap.get(conn.from);
        if (sourceExpr) {
          lines.push(`${matVarName}.${inputPort.id} = ${sourceExpr};`);
          materialAssignments.push(`${matVarName}.${inputPort.id}`);
        }
      }
    }
  }

  // ── Build import statement ──
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
