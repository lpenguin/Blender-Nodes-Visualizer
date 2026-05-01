import { describe, it, expect } from 'vitest';
import {
  getPortColor,
  rgbToHex,
  hexToRgb,
  generateGradientCSS,
  getPortPosition,
  calculateNodeContentSize,
  calculateBezierPath,
  applyConnectionState,
  parseGraphJSON,
  isValidVector3,
  isValidRotation,
  isValidColor,
  isValidGradient,
} from './utils';
import { NodeData, GraphSchema } from './types';

describe('getPortColor', () => {
  it('returns correct color for known type', () => {
    expect(getPortColor('float')).toBe('#A1A1A1');
    expect(getPortColor('color')).toBe('#C7C729');
    expect(getPortColor('vec2')).toBe('#63C7C7');
  });

  it('defaults to float color for unknown type', () => {
    expect(getPortColor('nonexistent')).toBe('#A1A1A1');
  });

  it('is case-insensitive', () => {
    expect(getPortColor('Float')).toBe('#A1A1A1');
    expect(getPortColor('COLOR')).toBe('#C7C729');
  });
});

describe('rgbToHex', () => {
  it('converts [0,0,0] to #000000', () => {
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
  });

  it('converts [1,1,1] to #ffffff', () => {
    expect(rgbToHex([1, 1, 1])).toBe('#ffffff');
  });

  it('clamps values', () => {
    expect(rgbToHex([-0.5, 1.5, 0])).toBe('#00ff00');
  });

  it('pads single-digit hex', () => {
    expect(rgbToHex([0, 0, 10 / 255])).toBe('#00000a');
  });
});

describe('hexToRgb', () => {
  it('converts #ff0000 to [1,0,0]', () => {
    expect(hexToRgb('#ff0000')).toEqual([1, 0, 0]);
  });

  it('handles no # prefix', () => {
    expect(hexToRgb('00ff00')).toEqual([0, 1, 0]);
  });

  it('adds alpha when provided', () => {
    expect(hexToRgb('#0000ff', 0.5)).toEqual([0, 0, 1, 0.5]);
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('xyz')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });

  it('trims whitespace', () => {
    expect(hexToRgb('  #ff0000  ')).toEqual([1, 0, 0]);
  });
});

describe('generateGradientCSS', () => {
  it('returns default for empty stops', () => {
    expect(generateGradientCSS([])).toBe('#4b4b4b');
    expect(generateGradientCSS(null as any)).toBe('#4b4b4b');
  });

  it('generates single-stop gradient', () => {
    const result = generateGradientCSS([{ pos: 0.5, color: [1, 0, 0] }]);
    expect(result).toContain('linear-gradient(90deg');
    expect(result).toContain('rgb(255, 0, 0) 50%');
  });

  it('sorts stops by position', () => {
    const result = generateGradientCSS([
      { pos: 1, color: [0, 0, 1] },
      { pos: 0, color: [1, 0, 0] },
    ]);
    expect(result.indexOf('rgb(255, 0, 0)')).toBeLessThan(result.indexOf('rgb(0, 0, 255)'));
  });

  it('clamps positions 0-1', () => {
    const result = generateGradientCSS([{ pos: -0.5, color: [1, 0, 0] }]);
    expect(result).toContain('0%');
  });
});

describe('isValidVector3', () => {
  it('accepts valid vector3', () => {
    expect(isValidVector3([1, 2, 3])).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidVector3([1, 2])).toBe(false);
    expect(isValidVector3([1, 2, 3, 4])).toBe(false);
  });

  it('rejects non-array', () => {
    expect(isValidVector3('not array')).toBe(false);
  });

  it('rejects non-number elements', () => {
    expect(isValidVector3([1, '2', 3])).toBe(false);
  });
});

describe('isValidRotation', () => {
  it('accepts valid rotation', () => {
    expect(isValidRotation([0, 90, 180])).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidRotation([0, 90])).toBe(false);
  });
});

describe('isValidColor', () => {
  it('accepts 3-element color', () => {
    expect(isValidColor([1, 0, 0])).toBe(true);
  });

  it('accepts 4-element color (with alpha)', () => {
    expect(isValidColor([1, 0, 0, 0.5])).toBe(true);
  });

  it('rejects other lengths', () => {
    expect(isValidColor([1, 0])).toBe(false);
  });
});

describe('isValidGradient', () => {
  it('accepts valid gradient stops', () => {
    expect(isValidGradient([{ pos: 0, color: [1, 0, 0] }, { pos: 1, color: [0, 0, 1] }])).toBe(true);
  });

  it('rejects missing pos', () => {
    expect(isValidGradient([{ color: [1, 0, 0] }])).toBe(false);
  });

  it('rejects invalid color in stop', () => {
    expect(isValidGradient([{ pos: 0.5, color: 'red' }])).toBe(false);
  });

  it('rejects non-array', () => {
    expect(isValidGradient('not array')).toBe(false);
  });
});

describe('getPortPosition', () => {
  const makeNode = (overrides: Partial<NodeData> = {}): NodeData => ({
    id: 'test_node',
    name: 'Test',
    type: 'tsl:Test',
    position: { x: 100, y: 200 },
    outputs: [{ id: 'out1', name: 'Out1', type: 'float' }],
    inputs: [{ id: 'in1', name: 'In1', type: 'float' }],
    ...overrides,
  });

  it('returns null for non-existent output port', () => {
    const node = makeNode();
    expect(getPortPosition(node, 'nonexistent', 'output')).toBeNull();
  });

  it('returns null for non-existent input port', () => {
    const node = makeNode();
    expect(getPortPosition(node, 'nonexistent', 'input')).toBeNull();
  });

  it('positions output at right edge of node', () => {
    const node = makeNode({ size: { width: 200, height: 200 } });
    const pos = getPortPosition(node, 'out1', 'output');
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(100 + 200); // position.x + width
  });

  it('positions input at left edge of node', () => {
    const node = makeNode({ size: { width: 200, height: 200 } });
    const pos = getPortPosition(node, 'in1', 'input');
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(100); // position.x
  });

  it('output y is below header + padding', () => {
    const node = makeNode({ size: { width: 200, height: 200 } });
    const pos = getPortPosition(node, 'out1', 'output');
    // HEADER(32) + BORDER(1) + PADDING(8) + half ITEM_H(12) = 53
    expect(pos!.y).toBe(200 + 1 + 32 + 8 + 12);
  });

  it('second output y is offset by ITEM_H + GAP', () => {
    const node = makeNode({
      outputs: [
        { id: 'out1', name: 'Out1', type: 'float' },
        { id: 'out2', name: 'Out2', type: 'color' },
      ],
    });
    const pos1 = getPortPosition(node, 'out1', 'output');
    const pos2 = getPortPosition(node, 'out2', 'output');
    expect(pos2!.y - pos1!.y).toBe(24 + 4); // ITEM_H + GAP
  });

  it('input y accounts for outputs and properties', () => {
    const node = makeNode({
      outputs: [{ id: 'out1', name: 'Out1', type: 'float' }],
      properties: [{ name: 'prop1', type: 'float', value: 0 }],
      inputs: [{ id: 'in1', name: 'In1', type: 'float' }],
    });
    const pos = getPortPosition(node, 'in1', 'input');
    // Input should be further down than output
    const outPos = getPortPosition(node, 'out1', 'output');
    expect(pos!.y).toBeGreaterThan(outPos!.y);
  });

  it('uses default width 200 when size not provided', () => {
    const node = makeNode();
    const pos = getPortPosition(node, 'out1', 'output');
    expect(pos!.x).toBe(100 + 200);
  });

  it('connected input uses base height (collapsed widget)', () => {
    const node = makeNode({
      inputs: [
        { id: 'in1', name: 'In1', type: 'float', connected: true },
        { id: 'in2', name: 'In2', type: 'float', connected: true },
      ],
    });
    const pos1 = getPortPosition(node, 'in1', 'input');
    const pos2 = getPortPosition(node, 'in2', 'input');
    expect(pos2!.y - pos1!.y).toBe(24 + 4); // BASE_H + GAP
  });

  it('disconnected float input uses taller height', () => {
    const node = makeNode({
      inputs: [
        { id: 'in1', name: 'In1', type: 'float', connected: false },
        { id: 'in2', name: 'In2', type: 'float', connected: false },
      ],
    });
    const pos1 = getPortPosition(node, 'in1', 'input');
    const pos2 = getPortPosition(node, 'in2', 'input');
    expect(pos2!.y - pos1!.y).toBe(28 + 4); // float widget height + GAP
  });

  it('gradient disconnected input uses expanded height', () => {
    const node = makeNode({
      inputs: [
        { id: 'in1', name: 'In1', type: 'gradient', connected: false },
        { id: 'in2', name: 'In2', type: 'float', connected: false },
      ],
    });
    const pos1 = getPortPosition(node, 'in1', 'input');
    const pos2 = getPortPosition(node, 'in2', 'input');
    expect(pos2!.y - pos1!.y).toBe(72 + 4); // gradient height + GAP
  });
});

describe('calculateNodeContentSize', () => {
  it('returns default width 200', () => {
    const node: NodeData = {
      id: 'n1', name: 'N', type: 'test', position: { x: 0, y: 0 },
    };
    const size = calculateNodeContentSize(node);
    expect(size.width).toBe(200);
  });

  it('height increases with more outputs', () => {
    const small: NodeData = {
      id: 'n1', name: 'N', type: 'test', position: { x: 0, y: 0 },
      outputs: [{ id: 'o1', name: 'O', type: 'float' }],
    };
    const large: NodeData = {
      id: 'n2', name: 'N', type: 'test', position: { x: 0, y: 0 },
      outputs: [{ id: 'o1', name: 'O', type: 'float' }, { id: 'o2', name: 'O2', type: 'float' }],
    };
    expect(calculateNodeContentSize(large).height).toBeGreaterThan(calculateNodeContentSize(small).height);
  });

  it('height increases with inputs', () => {
    const noInputs: NodeData = {
      id: 'n1', name: 'N', type: 'test', position: { x: 0, y: 0 },
    };
    const withInputs: NodeData = {
      id: 'n2', name: 'N', type: 'test', position: { x: 0, y: 0 },
      inputs: [{ id: 'i1', name: 'I', type: 'float', connected: false }],
    };
    expect(calculateNodeContentSize(withInputs).height).toBeGreaterThan(calculateNodeContentSize(noInputs).height);
  });

  it('gradient input adds more height than float input', () => {
    const floatNode: NodeData = {
      id: 'n1', name: 'N', type: 'test', position: { x: 0, y: 0 },
      inputs: [{ id: 'i1', name: 'I', type: 'float', connected: false }],
    };
    const gradNode: NodeData = {
      id: 'n2', name: 'N', type: 'test', position: { x: 0, y: 0 },
      inputs: [{ id: 'i1', name: 'I', type: 'gradient', connected: false }],
    };
    expect(calculateNodeContentSize(gradNode).height).toBeGreaterThan(calculateNodeContentSize(floatNode).height);
  });
});

describe('calculateBezierPath', () => {
  it('starts at x1,y1', () => {
    const path = calculateBezierPath(10, 20, 200, 40);
    expect(path.startsWith('M 10 20')).toBe(true);
  });

  it('ends at x2,y2', () => {
    const path = calculateBezierPath(10, 20, 200, 40);
    expect(path.endsWith('200 40')).toBe(true);
  });

  it('is a cubic bezier (C command)', () => {
    const path = calculateBezierPath(10, 20, 200, 40);
    expect(path).toContain(' C ');
  });

  it('control points extend horizontally', () => {
    const path = calculateBezierPath(0, 0, 100, 0);
    // cp1x should be > x1, cp2x should be < x2
    const match = path.match(/C (\S+) (\S+), (\S+) (\S+)/);
    expect(match).not.toBeNull();
    const cp1x = parseFloat(match![1]);
    const cp2x = parseFloat(match![3]);
    expect(cp1x).toBeGreaterThan(0);
    expect(cp2x).toBeLessThan(100);
  });

  it('minimum control point offset of 50px for close nodes', () => {
    const path = calculateBezierPath(0, 0, 20, 0);
    const match = path.match(/C (\S+) (\S+), (\S+) (\S+)/);
    expect(match).not.toBeNull();
    const cp1x = parseFloat(match![1]);
    const cp2x = parseFloat(match![3]);
    expect(cp1x).toBeGreaterThanOrEqual(50);
    expect(cp2x).toBeLessThanOrEqual(-30); // 20 - 50
  });

  it('control point y values match endpoint y values', () => {
    const path = calculateBezierPath(0, 10, 200, 50);
    const match = path.match(/C (\S+) (\S+), (\S+) (\S+)/);
    expect(match).not.toBeNull();
    expect(parseFloat(match![2])).toBe(10); // cp1y = y1
    expect(parseFloat(match![4])).toBe(50); // cp2y = y2
  });
});

describe('applyConnectionState', () => {
  it('marks connected inputs', () => {
    const schema: GraphSchema = {
      nodes: [
        {
          id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 },
          outputs: [{ id: 'out1', name: 'O', type: 'float' }],
        },
        {
          id: 'n2', name: 'B', type: 'test', position: { x: 200, y: 0 },
          inputs: [{ id: 'in1', name: 'I', type: 'float' }],
        },
      ],
      connections: [{ from: 'out1', to: 'in1' }],
    };
    const result = applyConnectionState(schema);
    const input = result.nodes[1].inputs![0];
    expect(input.connected).toBe(true);
  });

  it('marks unconnected inputs as not connected', () => {
    const schema: GraphSchema = {
      nodes: [
        {
          id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 },
          inputs: [{ id: 'in1', name: 'I', type: 'float', connected: true }],
        },
      ],
      connections: [],
    };
    const result = applyConnectionState(schema);
    expect(result.nodes[0].inputs![0].connected).toBe(false);
  });

  it('computes node size when missing', () => {
    const schema: GraphSchema = {
      nodes: [
        { id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 } },
      ],
      connections: [],
    };
    const result = applyConnectionState(schema);
    expect(result.nodes[0].size).toBeDefined();
    expect(result.nodes[0].size!.width).toBe(200);
  });

  it('preserves existing size', () => {
    const schema: GraphSchema = {
      nodes: [
        { id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 }, size: { width: 300, height: 150 } },
      ],
      connections: [],
    };
    const result = applyConnectionState(schema);
    expect(result.nodes[0].size).toEqual({ width: 300, height: 150 });
  });

  it('multiple connections mark multiple inputs', () => {
    const schema: GraphSchema = {
      nodes: [
        {
          id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 },
          outputs: [{ id: 'out1', name: 'O', type: 'float' }],
        },
        {
          id: 'n2', name: 'B', type: 'test', position: { x: 200, y: 0 },
          inputs: [
            { id: 'in1', name: 'I1', type: 'float' },
            { id: 'in2', name: 'I2', type: 'color' },
          ],
        },
        {
          id: 'n3', name: 'C', type: 'test', position: { x: 0, y: 100 },
          outputs: [{ id: 'out2', name: 'O2', type: 'color' }],
        },
      ],
      connections: [
        { from: 'out1', to: 'in1' },
        { from: 'out2', to: 'in2' },
      ],
    };
    const result = applyConnectionState(schema);
    expect(result.nodes[1].inputs![0].connected).toBe(true);
    expect(result.nodes[1].inputs![1].connected).toBe(true);
  });
});

describe('parseGraphJSON', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify({
      nodes: [{ id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 } }],
      connections: [],
    });
    const { schema, error } = parseGraphJSON(json);
    expect(schema).not.toBeNull();
    expect(error).toBeNull();
    expect(schema!.nodes).toHaveLength(1);
  });

  it('returns error for invalid JSON syntax', () => {
    const { schema, error } = parseGraphJSON('{bad json}');
    expect(schema).toBeNull();
    expect(error).not.toBeNull();
  });

  it('returns error when nodes array missing', () => {
    const { schema, error } = parseGraphJSON(JSON.stringify({ connections: [] }));
    expect(schema).toBeNull();
    expect(error).toContain('nodes');
  });

  it('defaults connections to empty array', () => {
    const json = JSON.stringify({
      nodes: [{ id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 } }],
    });
    const { schema } = parseGraphJSON(json);
    expect(schema!.connections).toEqual([]);
  });

  it('applies connection state after parsing', () => {
    const json = JSON.stringify({
      nodes: [
        { id: 'n1', name: 'A', type: 'test', position: { x: 0, y: 0 }, outputs: [{ id: 'o1', name: 'O', type: 'float' }] },
        { id: 'n2', name: 'B', type: 'test', position: { x: 0, y: 0 }, inputs: [{ id: 'i1', name: 'I', type: 'float' }] },
      ],
      connections: [{ from: 'o1', to: 'i1' }],
    });
    const { schema } = parseGraphJSON(json);
    expect(schema!.nodes[1].inputs![0].connected).toBe(true);
  });

  it('handles empty input', () => {
    const { schema, error } = parseGraphJSON('');
    expect(schema).toBeNull();
    expect(error).not.toBeNull();
  });
});
