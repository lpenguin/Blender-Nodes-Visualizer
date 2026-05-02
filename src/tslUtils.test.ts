import { describe, it, expect } from 'bun:test';
import { topoSort, sanitizeId } from './tslUtils';
import { NodeData, ConnectionData } from './types';

function makeNode(overrides: Partial<NodeData> & { id: string }): NodeData {
  return {
    name: overrides.type ?? 'test',
    type: 'test',
    position: { x: 0, y: 0 },
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

describe('topoSort', () => {
  it('returns empty for empty input', () => {
    expect(topoSort([], [])).toEqual([]);
  });

  it('returns nodes as-is when no connections', () => {
    const nodes = [makeNode({ id: 'a' }), makeNode({ id: 'b' })];
    const result = topoSort(nodes, []);
    expect(result).toHaveLength(2);
    expect(result.map(n => n.id).sort()).toEqual(['a', 'b']);
  });

  it('orders dependency before dependent', () => {
    const a = makeNode({ id: 'a', outputs: [{ id: 'a_out', name: 'O', type: 'float' }] });
    const b = makeNode({ id: 'b', inputs: [{ id: 'b_in', name: 'I', type: 'float' }] });
    const conns: ConnectionData[] = [{ from: 'a_out', to: 'b_in' }];
    const result = topoSort([b, a], conns);
    expect(result.map(n => n.id)).toEqual(['a', 'b']);
  });

  it('handles chain: a -> b -> c', () => {
    const a = makeNode({ id: 'a', outputs: [{ id: 'a_out', name: 'O', type: 'float' }] });
    const b = makeNode({ id: 'b', inputs: [{ id: 'b_in', name: 'I', type: 'float' }], outputs: [{ id: 'b_out', name: 'O', type: 'float' }] });
    const c = makeNode({ id: 'c', inputs: [{ id: 'c_in', name: 'I', type: 'float' }] });
    const conns: ConnectionData[] = [{ from: 'a_out', to: 'b_in' }, { from: 'b_out', to: 'c_in' }];
    const result = topoSort([c, a, b], conns);
    expect(result.map(n => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles diamond: a -> b, a -> c, b -> d, c -> d', () => {
    const a = makeNode({ id: 'a', outputs: [{ id: 'a_out', name: 'O', type: 'float' }] });
    const b = makeNode({ id: 'b', inputs: [{ id: 'b_in', name: 'I', type: 'float' }], outputs: [{ id: 'b_out', name: 'O', type: 'float' }] });
    const c = makeNode({ id: 'c', inputs: [{ id: 'c_in', name: 'I', type: 'float' }], outputs: [{ id: 'c_out', name: 'O', type: 'float' }] });
    const d = makeNode({ id: 'd', inputs: [{ id: 'd_in1', name: 'I1', type: 'float' }, { id: 'd_in2', name: 'I2', type: 'float' }] });
    const conns: ConnectionData[] = [
      { from: 'a_out', to: 'b_in' },
      { from: 'a_out', to: 'c_in' },
      { from: 'b_out', to: 'd_in1' },
      { from: 'c_out', to: 'd_in2' },
    ];
    const result = topoSort([d, c, b, a], conns);
    const ids = result.map(n => n.id);
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'));
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'));
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('d'));
  });

  it('ignores self-connections', () => {
    const a = makeNode({ id: 'a', inputs: [{ id: 'a_in', name: 'I', type: 'float' }], outputs: [{ id: 'a_out', name: 'O', type: 'float' }] });
    const conns: ConnectionData[] = [{ from: 'a_out', to: 'a_in' }];
    const result = topoSort([a], conns);
    expect(result).toHaveLength(1);
  });

  it('ignores connections to unknown ports', () => {
    const a = makeNode({ id: 'a' });
    const conns: ConnectionData[] = [{ from: 'ghost_out', to: 'ghost_in' }];
    const result = topoSort([a], conns);
    expect(result).toHaveLength(1);
  });

  it('handles disconnected subgraph', () => {
    const a = makeNode({ id: 'a', outputs: [{ id: 'a_out', name: 'O', type: 'float' }] });
    const b = makeNode({ id: 'b', inputs: [{ id: 'b_in', name: 'I', type: 'float' }] });
    const c = makeNode({ id: 'c' });
    const conns: ConnectionData[] = [{ from: 'a_out', to: 'b_in' }];
    const result = topoSort([c, b, a], conns);
    const ids = result.map(n => n.id);
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
    expect(ids).toContain('c');
  });
});

describe('sanitizeId', () => {
  it('passes through simple alphanumeric IDs', () => {
    expect(sanitizeId('abc123')).toBe('abc123');
  });

  it('replaces hyphens with underscores', () => {
    expect(sanitizeId('my-node')).toBe('my_node');
  });

  it('replaces dots and special characters', () => {
    expect(sanitizeId('node.v2@final')).toBe('node_v2_final');
  });

  it('prefixes IDs starting with a digit', () => {
    expect(sanitizeId('123node')).toBe('_123node');
  });

  it('handles IDs with $ and _', () => {
    expect(sanitizeId('my_node$1')).toBe('my_node$1');
  });

  it('handles empty string', () => {
    expect(sanitizeId('')).toBe('');
  });
});
