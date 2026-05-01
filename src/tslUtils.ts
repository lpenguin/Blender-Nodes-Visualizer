import { NodeData, ConnectionData } from './types';

export function topoSort(nodes: NodeData[], connections: ConnectionData[]): NodeData[] {
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

export function sanitizeId(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_$]/g, '_');
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
}
