import { TSLNodeDef } from '../tslHandlerContext';

export const GENERIC_TSL_DEFS: TSLNodeDef[] = [
  {
    type: 'tsl:FloatNode',
    name: 'Float',
    category: 'Inputs',
    description: 'A constant float value.',
    tslFn: 'float',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Value', type: 'float', defaultValue: 1.0 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:Vec2Node',
    name: 'Vec2',
    category: 'Inputs',
    description: 'A constant 2D vector.',
    tslFn: 'vec2',
    isSource: true,
    inputs: [
      { id: 'x', name: 'X', type: 'float', defaultValue: 0.0 },
      { id: 'y', name: 'Y', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec2', type: 'vec2' },
    ],
  },
  {
    type: 'tsl:Vec3Node',
    name: 'Vec3',
    category: 'Inputs',
    description: 'A constant 3D vector.',
    tslFn: 'vec3',
    isSource: true,
    inputs: [
      { id: 'x', name: 'X', type: 'float', defaultValue: 0.0 },
      { id: 'y', name: 'Y', type: 'float', defaultValue: 0.0 },
      { id: 'z', name: 'Z', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:Vec4Node',
    name: 'Vec4',
    category: 'Inputs',
    description: 'A constant 4D vector.',
    tslFn: 'vec4',
    isSource: true,
    inputs: [
      { id: 'x', name: 'X', type: 'float', defaultValue: 0.0 },
      { id: 'y', name: 'Y', type: 'float', defaultValue: 0.0 },
      { id: 'z', name: 'Z', type: 'float', defaultValue: 0.0 },
      { id: 'w', name: 'W', type: 'float', defaultValue: 1.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec4', type: 'vec4' },
    ],
  },
  {
    type: 'tsl:ColorNode',
    name: 'Color',
    category: 'Inputs',
    description: 'A constant RGB color.',
    tslFn: 'color',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Color', type: 'color', defaultValue: [1, 1, 1] },
    ],
    outputs: [
      { id: 'out', name: 'Color', type: 'color' },
    ],
  },
  {
    type: 'tsl:Add',
    name: 'Add',
    category: 'Math',
    description: 'a + b',
    tslFn: 'add',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Sub',
    name: 'Subtract',
    category: 'Math',
    description: 'a - b',
    tslFn: 'sub',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Mul',
    name: 'Multiply',
    category: 'Math',
    description: 'a * b',
    tslFn: 'mul',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Div',
    name: 'Divide',
    category: 'Math',
    description: 'a / b',
    tslFn: 'div',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Abs',
    name: 'Abs',
    category: 'Math',
    description: 'abs(a)',
    tslFn: 'abs',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Sin',
    name: 'Sin',
    category: 'Math',
    description: 'sin(a)',
    tslFn: 'sin',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Cos',
    name: 'Cos',
    category: 'Math',
    description: 'cos(a)',
    tslFn: 'cos',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Pow',
    name: 'Power',
    category: 'Math',
    description: 'pow(base, exp)',
    tslFn: 'pow',
    inputs: [
      { id: 'base', name: 'Base', type: 'float' },
      { id: 'exp', name: 'Exp', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Sqrt',
    name: 'Square Root',
    category: 'Math',
    description: 'sqrt(a)',
    tslFn: 'sqrt',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Clamp',
    name: 'Clamp',
    category: 'Math',
    description: 'clamp(value, min, max)',
    tslFn: 'clamp',
    inputs: [
      { id: 'value', name: 'Value', type: 'float' },
      { id: 'low', name: 'Min', type: 'float', defaultValue: 0.0 },
      { id: 'high', name: 'Max', type: 'float', defaultValue: 1.0 },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Mix',
    name: 'Mix',
    category: 'Math',
    description: 'mix(a, b, t) — linear interpolation',
    tslFn: 'mix',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
      { id: 't', name: 'T', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Step',
    name: 'Step',
    category: 'Math',
    description: 'step(edge, x) — returns 0 if x < edge, else 1',
    tslFn: 'step',
    inputs: [
      { id: 'edge', name: 'Edge', type: 'float' },
      { id: 'x', name: 'X', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Smoothstep',
    name: 'Smoothstep',
    category: 'Math',
    description: 'smoothstep(low, high, x)',
    tslFn: 'smoothstep',
    inputs: [
      { id: 'low', name: 'Low', type: 'float' },
      { id: 'high', name: 'High', type: 'float' },
      { id: 'x', name: 'X', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Min',
    name: 'Min',
    category: 'Math',
    description: 'min(a, b)',
    tslFn: 'min',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Max',
    name: 'Max',
    category: 'Math',
    description: 'max(a, b)',
    tslFn: 'max',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Fract',
    name: 'Fract',
    category: 'Math',
    description: 'fract(a) — fractional part',
    tslFn: 'fract',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Floor',
    name: 'Floor',
    category: 'Math',
    description: 'floor(a)',
    tslFn: 'floor',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Ceil',
    name: 'Ceil',
    category: 'Math',
    description: 'ceil(a)',
    tslFn: 'ceil',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Round',
    name: 'Round',
    category: 'Math',
    description: 'round(a)',
    tslFn: 'round',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Mod',
    name: 'Modulo',
    category: 'Math',
    description: 'mod(a, b) — modulo',
    tslFn: 'mod',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
      { id: 'b', name: 'B', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Sign',
    name: 'Sign',
    category: 'Math',
    description: 'sign(a) — returns -1, 0, or 1',
    tslFn: 'sign',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Log',
    name: 'Log',
    category: 'Math',
    description: 'log(a) — natural logarithm',
    tslFn: 'log',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Exp',
    name: 'Exp',
    category: 'Math',
    description: 'exp(a) — e^a',
    tslFn: 'exp',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Dot',
    name: 'Dot Product',
    category: 'Vector',
    description: 'dot(a, b)',
    tslFn: 'dot',
    inputs: [
      { id: 'a', name: 'A', type: 'vec3' },
      { id: 'b', name: 'B', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:Cross',
    name: 'Cross Product',
    category: 'Vector',
    description: 'cross(a, b)',
    tslFn: 'cross',
    inputs: [
      { id: 'a', name: 'A', type: 'vec3' },
      { id: 'b', name: 'B', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:Normalize',
    name: 'Normalize',
    category: 'Vector',
    description: 'normalize(v)',
    tslFn: 'normalize',
    inputs: [
      { id: 'v', name: 'Vector', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:Length',
    name: 'Length',
    category: 'Vector',
    description: 'length(v)',
    tslFn: 'length',
    inputs: [
      { id: 'v', name: 'Vector', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:Distance',
    name: 'Distance',
    category: 'Vector',
    description: 'distance(a, b)',
    tslFn: 'distance',
    inputs: [
      { id: 'a', name: 'A', type: 'vec3' },
      { id: 'b', name: 'B', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:Reflect',
    name: 'Reflect',
    category: 'Vector',
    description: 'reflect(incident, normal)',
    tslFn: 'reflect',
    inputs: [
      { id: 'i', name: 'Incident', type: 'vec3' },
      { id: 'n', name: 'Normal', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:Refract',
    name: 'Refract',
    category: 'Vector',
    description: 'refract(incident, normal, eta)',
    tslFn: 'refract',
    inputs: [
      { id: 'i', name: 'Incident', type: 'vec3' },
      { id: 'n', name: 'Normal', type: 'vec3' },
      { id: 'eta', name: 'Eta', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:MixColor',
    name: 'Mix Color',
    category: 'Color',
    description: 'mix(a, b, t) for colors',
    tslFn: 'mix',
    inputs: [
      { id: 'a', name: 'Color A', type: 'color' },
      { id: 'b', name: 'Color B', type: 'color' },
      { id: 't', name: 'Factor', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Color', type: 'color' },
    ],
  },
  {
    type: 'tsl:Hue',
    name: 'Hue / Saturation',
    category: 'Color',
    description: 'Adjust hue and saturation of a color.',
    tslFn: 'hue',
    inputs: [
      { id: 'color', name: 'Color', type: 'color' },
      { id: 'hue', name: 'Hue', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Color', type: 'color' },
    ],
  },
  {
    type: 'tsl:Saturation',
    name: 'Saturation',
    category: 'Color',
    description: 'Adjust saturation of a color.',
    tslFn: 'saturation',
    inputs: [
      { id: 'color', name: 'Color', type: 'color' },
      { id: 'amount', name: 'Amount', type: 'float', defaultValue: 1.0 },
    ],
    outputs: [
      { id: 'out', name: 'Color', type: 'color' },
    ],
  },
  {
    type: 'tsl:Luminance',
    name: 'Luminance',
    category: 'Color',
    description: 'Extract the luminance of a color.',
    tslFn: 'luminance',
    inputs: [
      { id: 'color', name: 'Color', type: 'color' },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:OneMinus',
    name: 'One Minus',
    category: 'Utility',
    description: '1.0 - a',
    tslFn: 'oneMinus',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Negate',
    name: 'Negate',
    category: 'Utility',
    description: '-a',
    tslFn: 'negate',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:Reciprocal',
    name: 'Reciprocal',
    category: 'Utility',
    description: '1 / a',
    tslFn: 'reciprocal',
    inputs: [
      { id: 'a', name: 'A', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Result', type: 'float' },
    ],
  },
  {
    type: 'tsl:ToFloat',
    name: 'To Float',
    category: 'Utility',
    description: 'Convert any value to float.',
    tslFn: 'float',
    inputs: [
      { id: 'a', name: 'Value', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:ToVec3',
    name: 'To Vec3',
    category: 'Utility',
    description: 'Cast/convert to vec3.',
    tslFn: 'vec3',
    inputs: [
      { id: 'a', name: 'Value', type: 'float' },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:ToColor',
    name: 'To Color',
    category: 'Utility',
    description: 'Cast/convert to color.',
    tslFn: 'color',
    inputs: [
      { id: 'a', name: 'Vec3', type: 'vec3' },
    ],
    outputs: [
      { id: 'out', name: 'Color', type: 'color' },
    ],
  },

  // === Noise: Cell Noise (float output) ===
  {
    type: 'tsl:CellNoiseFloat',
    name: 'Cell Noise (Float)',
    category: 'Noise',
    description: 'Cell/Voronoi noise returning a float from a float input.',
    tslFn: 'mx_cell_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:CellNoiseFloat2D',
    name: 'Cell Noise 2D (Float)',
    category: 'Noise',
    description: 'Cell/Voronoi noise returning a float from a vec2 input.',
    tslFn: 'mx_cell_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec2', defaultValue: [0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:CellNoiseFloat3D',
    name: 'Cell Noise 3D (Float)',
    category: 'Noise',
    description: 'Cell/Voronoi noise returning a float from a vec3 input.',
    tslFn: 'mx_cell_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:CellNoiseFloat4D',
    name: 'Cell Noise 4D (Float)',
    category: 'Noise',
    description: 'Cell/Voronoi noise returning a float from a vec4 input.',
    tslFn: 'mx_cell_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec4', defaultValue: [0, 0, 0, 1] },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },

  // === Noise: Worley Noise (float output) ===
  {
    type: 'tsl:WorleyNoiseFloat2D',
    name: 'Worley Noise 2D (Float)',
    category: 'Noise',
    description: 'Worley noise returning a float from a vec2 input.',
    tslFn: 'mx_worley_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec2', defaultValue: [0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:WorleyNoiseFloat3D',
    name: 'Worley Noise 3D (Float)',
    category: 'Noise',
    description: 'Worley noise returning a float from a vec3 input.',
    tslFn: 'mx_worley_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },

  // === Noise: Worley Noise (vec2 output) ===
  {
    type: 'tsl:WorleyNoiseVec22D',
    name: 'Worley Noise 2D (Vec2)',
    category: 'Noise',
    description: 'Worley noise returning a vec2 (F1, F2) from a vec2 input.',
    tslFn: 'mx_worley_noise_vec2',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec2', defaultValue: [0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec2', type: 'vec2' },
    ],
  },
  {
    type: 'tsl:WorleyNoiseVec23D',
    name: 'Worley Noise 3D (Vec2)',
    category: 'Noise',
    description: 'Worley noise returning a vec2 (F1, F2) from a vec3 input.',
    tslFn: 'mx_worley_noise_vec2',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec2', type: 'vec2' },
    ],
  },

  // === Noise: Worley Noise (vec3 output) ===
  {
    type: 'tsl:WorleyNoiseVec32D',
    name: 'Worley Noise 2D (Vec3)',
    category: 'Noise',
    description: 'Worley noise returning a vec3 (F1, F2, F3) from a vec2 input.',
    tslFn: 'mx_worley_noise_vec3',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec2', defaultValue: [0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:WorleyNoiseVec33D',
    name: 'Worley Noise 3D (Vec3)',
    category: 'Noise',
    description: 'Worley noise returning a vec3 (F1, F2, F3) from a vec3 input.',
    tslFn: 'mx_worley_noise_vec3',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'metric', name: 'Metric', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },

  // === Noise: Fractal Noise ===
  {
    type: 'tsl:FractalNoiseFloat',
    name: 'Fractal Noise (Float)',
    category: 'Noise',
    description: 'Fractal Perlin noise returning a float.',
    tslFn: 'mx_fractal_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:FractalNoiseVec2',
    name: 'Fractal Noise (Vec2)',
    category: 'Noise',
    description: 'Fractal Perlin noise returning a vec2.',
    tslFn: 'mx_fractal_noise_vec2',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Vec2', type: 'vec2' },
    ],
  },
  {
    type: 'tsl:FractalNoiseVec3',
    name: 'Fractal Noise (Vec3)',
    category: 'Noise',
    description: 'Fractal Perlin noise returning a vec3.',
    tslFn: 'mx_fractal_noise_vec3',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:FractalNoiseVec4',
    name: 'Fractal Noise (Vec4)',
    category: 'Noise',
    description: 'Fractal Perlin noise returning a vec4.',
    tslFn: 'mx_fractal_noise_vec4',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Vec4', type: 'vec4' },
    ],
  },

  // === Noise: Generic MX Noise ===
  {
    type: 'tsl:MXNoiseFloat',
    name: 'MX Noise (Float)',
    category: 'Noise',
    description: 'Generic MaterialX noise returning a float.',
    tslFn: 'mx_noise_float',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:MXNoiseVec3',
    name: 'MX Noise (Vec3)',
    category: 'Noise',
    description: 'Generic MaterialX noise returning a vec3.',
    tslFn: 'mx_noise_vec3',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Vec3', type: 'vec3' },
    ],
  },
  {
    type: 'tsl:MXNoiseVec4',
    name: 'MX Noise (Vec4)',
    category: 'Noise',
    description: 'Generic MaterialX noise returning a vec4.',
    tslFn: 'mx_noise_vec4',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Vec4', type: 'vec4' },
    ],
  },

  // === Noise: Unified Noise ===
  {
    type: 'tsl:UnifiedNoise2D',
    name: 'Unified Noise 2D',
    category: 'Noise',
    description: 'Unified 2D noise with selectable type (Perlin=0, Cell=1, Worley=2, Fractal=3).',
    tslFn: 'mx_unifiednoise2d',
    inputs: [
      { id: 'noiseType', name: 'Type', type: 'float', defaultValue: 0.0 },
      { id: 'texcoord', name: 'Texcoord', type: 'vec2', defaultValue: [0, 0] },
      { id: 'freq', name: 'Frequency', type: 'vec2', defaultValue: [1, 1] },
      { id: 'offset', name: 'Offset', type: 'vec2', defaultValue: [0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'outmin', name: 'Out Min', type: 'float', defaultValue: -1.0 },
      { id: 'outmax', name: 'Out Max', type: 'float', defaultValue: 1.0 },
      { id: 'clampoutput', name: 'Clamp', type: 'float', defaultValue: 0.0 },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
  {
    type: 'tsl:UnifiedNoise3D',
    name: 'Unified Noise 3D',
    category: 'Noise',
    description: 'Unified 3D noise with selectable type (Perlin=0, Cell=1, Worley=2, Fractal=3).',
    tslFn: 'mx_unifiednoise3d',
    inputs: [
      { id: 'noiseType', name: 'Type', type: 'float', defaultValue: 0.0 },
      { id: 'position', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'freq', name: 'Frequency', type: 'vec3', defaultValue: [1, 1, 1] },
      { id: 'offset', name: 'Offset', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'jitter', name: 'Jitter', type: 'float', defaultValue: 1.0 },
      { id: 'outmin', name: 'Out Min', type: 'float', defaultValue: -1.0 },
      { id: 'outmax', name: 'Out Max', type: 'float', defaultValue: 1.0 },
      { id: 'clampoutput', name: 'Clamp', type: 'float', defaultValue: 0.0 },
      { id: 'octaves', name: 'Octaves', type: 'float', defaultValue: 3.0 },
      { id: 'lacunarity', name: 'Lacunarity', type: 'float', defaultValue: 2.0 },
      { id: 'diminish', name: 'Diminish', type: 'float', defaultValue: 0.5 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },

  // === Noise: Tri Noise 3D ===
  {
    type: 'tsl:TriNoise3D',
    name: 'Tri Noise 3D',
    category: 'Noise',
    description: 'Triangular 3D noise with animated speed.',
    tslFn: 'triNoise3D',
    inputs: [
      { id: 'position', name: 'Position', type: 'vec3', defaultValue: [0, 0, 0] },
      { id: 'speed', name: 'Speed', type: 'float', defaultValue: 1.0 },
      { id: 'time', name: 'Time', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },

  // === Noise: Interleaved Gradient Noise ===
  {
    type: 'tsl:InterleavedGradientNoise',
    name: 'Interleaved Gradient Noise',
    category: 'Noise',
    description: 'Interleaved gradient noise for dithering (vec2 input).',
    tslFn: 'interleavedGradientNoise',
    inputs: [
      { id: 'p', name: 'Position', type: 'vec2', defaultValue: [0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Float', type: 'float' },
    ],
  },
];
