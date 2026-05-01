import { describe, it, expect } from 'bun:test';
import { exportTSL } from './tslExport';
import { GraphSchema, NodeData } from './types';

function makeNode(overrides: Partial<NodeData> & { id: string; type: string }): NodeData {
  return {
    name: overrides.type,
    position: { x: 0, y: 0 },
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

describe('exportTSL', () => {
  it('handles an empty graph', () => {
    const schema: GraphSchema = { nodes: [], connections: [] };
    const result = exportTSL(schema);
    expect(result).toContain("import * as THREE from 'three';");
    expect(result).toContain("// No TSL imports needed");
  });

  describe('builtin source nodes', () => {
    it('generates UV node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uv1 = uv();');
      expect(result).toContain('uv');
    });

    it('generates Time node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const time1 = time;');
    });

    it('generates PositionLocal node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'pos1', type: 'tsl:PositionLocal', outputs: [{ id: 'pos1_out', name: 'Position', type: 'vec3' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const pos1 = positionLocal;');
    });

    it('generates PositionWorld node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'pw1', type: 'tsl:PositionWorld', outputs: [{ id: 'pw1_out', name: 'Position', type: 'vec3' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const pw1 = positionWorld;');
    });

    it('generates NormalLocal node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'n1', type: 'tsl:NormalLocal', outputs: [{ id: 'n1_out', name: 'Normal', type: 'vec3' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const n1 = normalLocal;');
    });

    it('generates CameraPosition node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'cam1', type: 'tsl:CameraPosition', outputs: [{ id: 'cam1_out', name: 'Position', type: 'vec3' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const cam1 = cameraPosition;');
    });

    it('generates VertexColor node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'vc1', type: 'tsl:VertexColor', outputs: [{ id: 'vc1_out', name: 'Color', type: 'color' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const vc1 = vertexColor();');
    });

    it('generates NormalView node', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'nv1', type: 'tsl:NormalView', outputs: [{ id: 'nv1_out', name: 'Normal', type: 'vec3' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const nv1 = normalView;');
    });

    it('adds correct imports for builtin source nodes', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
        ],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('time');
      expect(result).toContain('uv');
    });
  });

  describe('generic function nodes (unconnected)', () => {
    it('generates a Sin node with default value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'sin1',
          type: 'tsl:Sin',
          inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
          outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const sin1 = sin(0);');
      expect(result).toContain('sin');
    });

    it('generates an Add node with default values', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'add1',
          type: 'tsl:Add',
          inputs: [
            { id: 'add1_a', name: 'A', type: 'float' },
            { id: 'add1_b', name: 'B', type: 'float' },
          ],
          outputs: [{ id: 'add1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const add1 = add(0, 0);');
    });

    it('generates a Mul node with specified input values', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'mul1',
          type: 'tsl:Mul',
          inputs: [
            { id: 'mul1_a', name: 'A', type: 'float', value: 2.5 },
            { id: 'mul1_b', name: 'B', type: 'float', value: 3.0 },
          ],
          outputs: [{ id: 'mul1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const mul1 = mul(2.5000, 3.0000);');
    });

    it('generates a Clamp node with default min/max', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'clamp1',
          type: 'tsl:Clamp',
          inputs: [
            { id: 'clamp1_value', name: 'Value', type: 'float' },
            { id: 'clamp1_low', name: 'Min', type: 'float', value: 0.0 },
            { id: 'clamp1_high', name: 'Max', type: 'float', value: 1.0 },
          ],
          outputs: [{ id: 'clamp1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const clamp1 = clamp(0, 0.0000, 1.0000);');
    });

    it('generates a Dot node with undefined vec3 values (falls back to 0)', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'dot1',
          type: 'tsl:Dot',
          inputs: [
            { id: 'dot1_a', name: 'A', type: 'vec3' },
            { id: 'dot1_b', name: 'B', type: 'vec3' },
          ],
          outputs: [{ id: 'dot1_out', name: 'Float', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const dot1 = dot(0, 0);');
    });

    it('generates a Dot node with vec3 values provided', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'dot1',
          type: 'tsl:Dot',
          inputs: [
            { id: 'dot1_a', name: 'A', type: 'vec3', value: [1, 2, 3] },
            { id: 'dot1_b', name: 'B', type: 'vec3', value: [4, 5, 6] },
          ],
          outputs: [{ id: 'dot1_out', name: 'Float', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const dot1 = dot(vec3(1.0000, 2.0000, 3.0000), vec3(4.0000, 5.0000, 6.0000));');
    });

    it('uses port definition default values when port value is undefined', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'mix1',
          type: 'tsl:Mix',
          inputs: [
            { id: 'mix1_a', name: 'A', type: 'float' },
            { id: 'mix1_b', name: 'B', type: 'float' },
            { id: 'mix1_t', name: 'T', type: 'float' },
          ],
          outputs: [{ id: 'mix1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const mix1 = mix(0, 0, 0);');
    });
  });

  describe('connected nodes', () => {
    it('connects UV output to Sin input', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [{ from: 'uv1_out', to: 'sin1_a' }],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uv1 = uv();');
      expect(result).toContain('const sin1 = sin(uv1);');
    });

    it('connects Time -> Sin -> Add', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'add1',
            type: 'tsl:Add',
            inputs: [
              { id: 'add1_a', name: 'A', type: 'float' },
              { id: 'add1_b', name: 'B', type: 'float', value: 0.5 },
            ],
            outputs: [{ id: 'add1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'sin1_a' },
          { from: 'sin1_out', to: 'add1_a' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const time1 = time;');
      expect(result).toContain('const sin1 = sin(time1);');
      expect(result).toContain('const add1 = add(sin1, 0.5000);');
    });

    it('respects topological order - dependencies come before dependents', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'add1',
            type: 'tsl:Add',
            inputs: [
              { id: 'add1_a', name: 'A', type: 'float' },
              { id: 'add1_b', name: 'B', type: 'float' },
            ],
            outputs: [{ id: 'add1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
        ],
        connections: [{ from: 'uv1_out', to: 'add1_a' }],
      };
      const result = exportTSL(schema);
      const uvPos = result.indexOf('const uv1');
      const addPos = result.indexOf('const add1');
      expect(uvPos).toBeLessThan(addPos);
    });

    it('handles chains of connections', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'abs1',
            type: 'tsl:Abs',
            inputs: [{ id: 'abs1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'abs1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'sin1_a' },
          { from: 'sin1_out', to: 'abs1_a' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const time1 = time;');
      expect(result).toContain('const sin1 = sin(time1);');
      expect(result).toContain('const abs1 = abs(sin1);');
    });
  });

  describe('SplitXYZ special case', () => {
    it('generates SplitXYZ from a connected PositionLocal', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'pos1', type: 'tsl:PositionLocal', outputs: [{ id: 'pos1_out', name: 'Position', type: 'vec3' }] }),
          makeNode({
            id: 'split1',
            type: 'tsl:SplitXYZ',
            inputs: [{ id: 'split1_v', name: 'Vector', type: 'vec3' }],
            outputs: [
              { id: 'split1_x', name: 'X', type: 'float' },
              { id: 'split1_y', name: 'Y', type: 'float' },
              { id: 'split1_z', name: 'Z', type: 'float' },
            ],
          }),
        ],
        connections: [{ from: 'pos1_out', to: 'split1_v' }],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const split1 = pos1;');
    });

    it('generates SplitXYZ with 0 fallback when unconnected', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'split1',
          type: 'tsl:SplitXYZ',
          inputs: [{ id: 'split1_v', name: 'Vector', type: 'vec3' }],
          outputs: [
            { id: 'split1_x', name: 'X', type: 'float' },
            { id: 'split1_y', name: 'Y', type: 'float' },
            { id: 'split1_z', name: 'Z', type: 'float' },
          ],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const split1 = 0;');
    });

    it('maps split outputs to .x, .y, .z for downstream nodes', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'pos1', type: 'tsl:PositionLocal', outputs: [{ id: 'pos1_out', name: 'Position', type: 'vec3' }] }),
          makeNode({
            id: 'split1',
            type: 'tsl:SplitXYZ',
            inputs: [{ id: 'split1_v', name: 'Vector', type: 'vec3' }],
            outputs: [
              { id: 'split1_x', name: 'X', type: 'float' },
              { id: 'split1_y', name: 'Y', type: 'float' },
              { id: 'split1_z', name: 'Z', type: 'float' },
            ],
          }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [
          { from: 'pos1_out', to: 'split1_v' },
          { from: 'split1_x', to: 'sin1_a' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const split1 = pos1;');
      expect(result).toContain('const sin1 = sin(split1.x);');
    });

    it('maps .y output for downstream nodes', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'pos1', type: 'tsl:PositionLocal', outputs: [{ id: 'pos1_out', name: 'Position', type: 'vec3' }] }),
          makeNode({
            id: 'split1',
            type: 'tsl:SplitXYZ',
            inputs: [{ id: 'split1_v', name: 'Vector', type: 'vec3' }],
            outputs: [
              { id: 'split1_x', name: 'X', type: 'float' },
              { id: 'split1_y', name: 'Y', type: 'float' },
              { id: 'split1_z', name: 'Z', type: 'float' },
            ],
          }),
          makeNode({
            id: 'mul1',
            type: 'tsl:Mul',
            inputs: [
              { id: 'mul1_a', name: 'A', type: 'float' },
              { id: 'mul1_b', name: 'B', type: 'float' },
            ],
            outputs: [{ id: 'mul1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [
          { from: 'pos1_out', to: 'split1_v' },
          { from: 'split1_y', to: 'mul1_a' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const mul1 = mul(split1.y, 0);');
    });
  });

  describe('TextureSample special case', () => {
    it('generates TextureSample with connected UV', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
        ],
        connections: [{ from: 'uv1_out', to: 'tex1_uv' }],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const tex1 = texture(myTexture, uv1);');
    });

    it('generates TextureSample with 0 fallback when UV port is unconnected', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'tex1',
          type: 'tsl:TextureSample',
          inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
          outputs: [
            { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
            { id: 'tex1_rgb', name: 'RGB', type: 'color' },
            { id: 'tex1_a', name: 'Alpha', type: 'float' },
          ],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const tex1 = texture(myTexture, 0);');
    });

    it('maps RGB output to .rgb for downstream nodes', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'uv1_out', to: 'tex1_uv' },
          { from: 'tex1_rgb', to: 'mat1_colorNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('mat1.colorNode = tex1.rgb;');
    });

    it('maps Alpha output to .a for downstream nodes', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
          makeNode({
            id: 'mul1',
            type: 'tsl:Mul',
            inputs: [
              { id: 'mul1_a', name: 'A', type: 'float' },
              { id: 'mul1_b', name: 'B', type: 'float' },
            ],
            outputs: [{ id: 'mul1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [{ from: 'tex1_a', to: 'mul1_a' }],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const mul1 = mul(tex1.a, 0);');
    });
  });

  describe('Uniform nodes', () => {
    it('generates UniformFloat with a value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uf1',
          type: 'tsl:UniformFloat',
          inputs: [{ id: 'uf1_value', name: 'Value', type: 'float', value: 2.5 }],
          outputs: [{ id: 'uf1_out', name: 'Uniform', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uf1 = uniform(2.5000);');
    });

    it('generates UniformFloat with default value when no value set', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uf1',
          type: 'tsl:UniformFloat',
          inputs: [{ id: 'uf1_value', name: 'Value', type: 'float' }],
          outputs: [{ id: 'uf1_out', name: 'Uniform', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uf1 = uniform(0.0);');
    });

    it('generates UniformVec3 with a value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uv3_1',
          type: 'tsl:UniformVec3',
          inputs: [{ id: 'uv3_1_value', name: 'Value', type: 'vec3', value: [1, 2, 3] }],
          outputs: [{ id: 'uv3_1_out', name: 'Uniform', type: 'vec3' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uv3_1 = uniform(new THREE.Vector3(1, 2, 3));');
    });

    it('generates UniformVec3 with default value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uv3_1',
          type: 'tsl:UniformVec3',
          inputs: [{ id: 'uv3_1_value', name: 'Value', type: 'vec3' }],
          outputs: [{ id: 'uv3_1_out', name: 'Uniform', type: 'vec3' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uv3_1 = uniform(new THREE.Vector3(0, 0, 0));');
    });

    it('generates UniformColor with a value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uc1',
          type: 'tsl:UniformColor',
          inputs: [{ id: 'uc1_value', name: 'Value', type: 'color', value: [0.5, 0.3, 0.8] }],
          outputs: [{ id: 'uc1_out', name: 'Uniform', type: 'color' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uc1 = uniform(new THREE.Color(0.5, 0.3, 0.8));');
    });

    it('generates UniformColor with default value', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uc1',
          type: 'tsl:UniformColor',
          inputs: [{ id: 'uc1_value', name: 'Value', type: 'color' }],
          outputs: [{ id: 'uc1_out', name: 'Uniform', type: 'color' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uc1 = uniform(new THREE.Color(1, 1, 1));');
    });

    it('adds "uniform" to imports for all uniform nodes', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'uf1',
          type: 'tsl:UniformFloat',
          inputs: [{ id: 'uf1_value', name: 'Value', type: 'float' }],
          outputs: [{ id: 'uf1_out', name: 'Uniform', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('uniform');
    });

    it('UniformFloat connected to downstream node', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'uf1',
            type: 'tsl:UniformFloat',
            inputs: [{ id: 'uf1_value', name: 'Value', type: 'float', value: 1.5 }],
            outputs: [{ id: 'uf1_out', name: 'Uniform', type: 'float' }],
          }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [{ from: 'uf1_out', to: 'sin1_a' }],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const uf1 = uniform(1.5000);');
      expect(result).toContain('const sin1 = sin(uf1);');
    });
  });

  describe('Material output nodes', () => {
    it('generates MaterialOutput with connected colorNode', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'uv1_out', to: 'tex1_uv' },
          { from: 'tex1_rgb', to: 'mat1_colorNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const mat1 = new MeshStandardNodeMaterial();');
      expect(result).toContain('mat1.colorNode = tex1.rgb;');
    });

    it('generates PhysicalMaterialOutput', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
          makeNode({
            id: 'pmat1',
            type: 'tsl:PhysicalMaterialOutput',
            inputs: [
              { id: 'pmat1_colorNode', name: 'Color', type: 'color' },
              { id: 'pmat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'pmat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'pmat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'pmat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'pmat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'pmat1_clearcoatNode', name: 'Clearcoat', type: 'float' },
              { id: 'pmat1_transmissionNode', name: 'Transmission', type: 'float' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'uv1_out', to: 'tex1_uv' },
          { from: 'tex1_rgb', to: 'pmat1_colorNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const pmat1 = new MeshPhysicalNodeMaterial();');
    });

    it('only assigns connected material inputs', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'mat1_roughnessNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('mat1.roughnessNode = time1;');
      expect(result).not.toContain('mat1.colorNode');
      expect(result).not.toContain('mat1.metalnessNode');
    });

    it('places material output at the end of generated code', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
        ],
        connections: [
          { from: 'time1_out', to: 'mat1_roughnessNode' },
        ],
      };
      const result = exportTSL(schema);
      const timePos = result.indexOf('const time1 = time;');
      const matPos = result.indexOf('const mat1 = new MeshStandardNodeMaterial');
      expect(timePos).toBeLessThan(matPos);
    });

    it('assigns multiple connected material inputs', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'sin1_a' },
          { from: 'sin1_out', to: 'mat1_roughnessNode' },
          { from: 'time1_out', to: 'mat1_metalnessNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('mat1.roughnessNode = sin1;');
      expect(result).toContain('mat1.metalnessNode = time1;');
    });
  });

  describe('unknown node types', () => {
    it('emits a comment placeholder for unknown types', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'unknown1', type: 'tsl:CustomUnknown', name: 'My Custom Node' })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('// [Unknown node] My Custom Node (tsl:CustomUnknown)');
    });

    it('continues processing other nodes after an unknown type', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'unknown1', type: 'tsl:CustomUnknown', name: 'Custom' }),
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
        ],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('// [Unknown node]');
      expect(result).toContain('const uv1 = uv();');
    });
  });

  describe('ID sanitization', () => {
    it('replaces non-alphanumeric characters with underscores', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'my-uv-node', type: 'tsl:UV', outputs: [{ id: 'p1', name: 'UV', type: 'vec2' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const my_uv_node = uv();');
    });

    it('prefixes IDs starting with a digit', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: '123node', type: 'tsl:UV', outputs: [{ id: 'p1', name: 'UV', type: 'vec2' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const _123node = uv();');
    });

    it('handles IDs with dots and special characters', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({ id: 'node.v2@final', type: 'tsl:UV', outputs: [{ id: 'p1', name: 'UV', type: 'vec2' }] })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const node_v2_final = uv();');
    });
  });

  describe('formatDefaultValue (via generated code)', () => {
    it('formats float values with 4 decimal places', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'sin1',
          type: 'tsl:Sin',
          inputs: [{ id: 'sin1_a', name: 'A', type: 'float', value: 3.14159 }],
          outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('3.1416');
    });

    it('formats vec3 values', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'dot1',
          type: 'tsl:Dot',
          inputs: [
            { id: 'dot1_a', name: 'A', type: 'vec3', value: [1, 2, 3] },
            { id: 'dot1_b', name: 'B', type: 'vec3' },
          ],
          outputs: [{ id: 'dot1_out', name: 'Float', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('vec3(1.0000, 2.0000, 3.0000)');
    });

    it('formats color values', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'mixc1',
          type: 'tsl:MixColor',
          inputs: [
            { id: 'mixc1_a', name: 'Color A', type: 'color', value: [0.5, 0.3, 0.8] },
            { id: 'mixc1_b', name: 'Color B', type: 'color' },
            { id: 'mixc1_t', name: 'Factor', type: 'float' },
          ],
          outputs: [{ id: 'mixc1_out', name: 'Color', type: 'color' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('color(0.5000, 0.3000, 0.8000)');
    });

    it('uses 0 for undefined values regardless of type', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'sin1',
          type: 'tsl:Sin',
          inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
          outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('sin(0)');
    });
  });

  describe('import generation', () => {
    it('generates THREE import', () => {
      const schema: GraphSchema = { nodes: [makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'p1', name: 'UV', type: 'vec2' }] })], connections: [] };
      const result = exportTSL(schema);
      expect(result).toContain("import * as THREE from 'three';");
    });

    it('generates sorted TSL imports', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'mul1', type: 'tsl:Mul', inputs: [{ id: 'mul1_a', name: 'A', type: 'float' }, { id: 'mul1_b', name: 'B', type: 'float' }], outputs: [{ id: 'mul1_out', name: 'Result', type: 'float' }] }),
          makeNode({ id: 'add1', type: 'tsl:Add', inputs: [{ id: 'add1_a', name: 'A', type: 'float' }, { id: 'add1_b', name: 'B', type: 'float' }], outputs: [{ id: 'add1_out', name: 'Result', type: 'float' }] }),
        ],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain("import { add, mul } from 'three/tsl';");
    });

    it('includes MaterialOutput class in imports', () => {
      const schema: GraphSchema = {
        nodes: [makeNode({
          id: 'mat1',
          type: 'tsl:MaterialOutput',
          inputs: [
            { id: 'mat1_colorNode', name: 'Color', type: 'color' },
            { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
            { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
            { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
            { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
            { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
            { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
          ],
          outputs: [],
        })],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('MeshStandardNodeMaterial');
    });

    it('deduplicates imports', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'sin2',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin2_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin2_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [],
      };
      const result = exportTSL(schema);
      const importLine = result.split('\n').find(l => l.includes('from') && l.includes("'three/tsl'"));
      expect(importLine).toBeDefined();
      const fns = (/\{(.+)\}/.exec((importLine!)))?.[1].split(',').map(s => s.trim());
      expect(fns).toBeDefined();
      expect(new Set(fns).size).toBe(fns!.length);
    });
  });

  describe('multi-output generic nodes', () => {
    it('maps multiple outputs with bracket indexing', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
        ],
        connections: [],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const tex1 = texture(myTexture, 0);');
    });
  });

  describe('complex graph scenarios', () => {
    it('generates a complete shader: UV -> TextureSample -> MaterialOutput', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'uv1', type: 'tsl:UV', outputs: [{ id: 'uv1_out', name: 'UV', type: 'vec2' }] }),
          makeNode({
            id: 'tex1',
            type: 'tsl:TextureSample',
            inputs: [{ id: 'tex1_uv', name: 'UV', type: 'vec2' }],
            outputs: [
              { id: 'tex1_rgba', name: 'RGBA', type: 'vec4' },
              { id: 'tex1_rgb', name: 'RGB', type: 'color' },
              { id: 'tex1_a', name: 'Alpha', type: 'float' },
            ],
          }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'uv1_out', to: 'tex1_uv' },
          { from: 'tex1_rgb', to: 'mat1_colorNode' },
        ],
      };
      const result = exportTSL(schema);

      expect(result).toContain("import * as THREE from 'three';");
      expect(result).toContain('uv');
      expect(result).toContain('texture');
      expect(result).toContain('MeshStandardNodeMaterial');
      expect(result).toContain('const uv1 = uv();');
      expect(result).toContain('const tex1 = texture(myTexture, uv1);');
      expect(result).toContain('const mat1 = new MeshStandardNodeMaterial();');
      expect(result).toContain('mat1.colorNode = tex1.rgb;');
    });

    it('generates a procedural shader: Time -> Sin -> Mul -> MaterialOutput', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'mul1',
            type: 'tsl:Mul',
            inputs: [
              { id: 'mul1_a', name: 'A', type: 'float' },
              { id: 'mul1_b', name: 'B', type: 'float', value: 0.5 },
            ],
            outputs: [{ id: 'mul1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'mat1',
            type: 'tsl:MaterialOutput',
            inputs: [
              { id: 'mat1_colorNode', name: 'Color', type: 'color' },
              { id: 'mat1_roughnessNode', name: 'Roughness', type: 'float' },
              { id: 'mat1_metalnessNode', name: 'Metalness', type: 'float' },
              { id: 'mat1_emissiveNode', name: 'Emissive', type: 'color' },
              { id: 'mat1_normalNode', name: 'Normal', type: 'vec3' },
              { id: 'mat1_opacityNode', name: 'Opacity', type: 'float' },
              { id: 'mat1_positionNode', name: 'Position', type: 'vec3' },
            ],
            outputs: [],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'sin1_a' },
          { from: 'sin1_out', to: 'mul1_a' },
          { from: 'mul1_out', to: 'mat1_roughnessNode' },
        ],
      };
      const result = exportTSL(schema);
      expect(result).toContain('const time1 = time;');
      expect(result).toContain('const sin1 = sin(time1);');
      expect(result).toContain('const mul1 = mul(sin1, 0.5000);');
      expect(result).toContain('mat1.roughnessNode = mul1;');
    });

    it('handles diamond dependency graph (fan-out and fan-in)', () => {
      const schema: GraphSchema = {
        nodes: [
          makeNode({ id: 'time1', type: 'tsl:Time', outputs: [{ id: 'time1_out', name: 'Time', type: 'float' }] }),
          makeNode({
            id: 'sin1',
            type: 'tsl:Sin',
            inputs: [{ id: 'sin1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'sin1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'cos1',
            type: 'tsl:Cos',
            inputs: [{ id: 'cos1_a', name: 'A', type: 'float' }],
            outputs: [{ id: 'cos1_out', name: 'Result', type: 'float' }],
          }),
          makeNode({
            id: 'add1',
            type: 'tsl:Add',
            inputs: [
              { id: 'add1_a', name: 'A', type: 'float' },
              { id: 'add1_b', name: 'B', type: 'float' },
            ],
            outputs: [{ id: 'add1_out', name: 'Result', type: 'float' }],
          }),
        ],
        connections: [
          { from: 'time1_out', to: 'sin1_a' },
          { from: 'time1_out', to: 'cos1_a' },
          { from: 'sin1_out', to: 'add1_a' },
          { from: 'cos1_out', to: 'add1_b' },
        ],
      };
      const result = exportTSL(schema);
      const timePos = result.indexOf('const time1');
      const sinPos = result.indexOf('const sin1');
      const cosPos = result.indexOf('const cos1');
      const addPos = result.indexOf('const add1');

      expect(timePos).toBeLessThan(sinPos);
      expect(timePos).toBeLessThan(cosPos);
      expect(sinPos).toBeLessThan(addPos);
      expect(cosPos).toBeLessThan(addPos);
    });
  });

  describe('header and formatting', () => {
    it('starts with a comment header', () => {
      const schema: GraphSchema = { nodes: [], connections: [] };
      const result = exportTSL(schema);
      expect(result).toContain('// Generated by Three.js TSL Node Editor');
      expect(result).toContain('// https://github.com/mrdoob/three.js');
    });

    it('always includes THREE import', () => {
      const schema: GraphSchema = { nodes: [], connections: [] };
      const result = exportTSL(schema);
      expect(result).toContain("import * as THREE from 'three';");
    });

    it('shows "No TSL imports needed" when no TSL nodes are present', () => {
      const schema: GraphSchema = { nodes: [], connections: [] };
      const result = exportTSL(schema);
      expect(result).toContain('// No TSL imports needed');
    });
  });
});
