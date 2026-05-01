
// Three.js TSL type colors (inspired by GLSL / Three.js node editor palette)
export const TYPE_COLORS: Record<string, string> = {
  float:   '#A1A1A1', // Grey
  vec2:    '#63C7C7', // Cyan
  vec3:    '#6363C7', // Purple/Blue
  vec4:    '#9263C7', // Violet
  color:   '#C7C729', // Yellow
  mat3:    '#C77D29', // Orange
  mat4:    '#C77D29', // Orange
  bool:    '#63C763', // Green
  int:     '#85A1A1', // Slate
  // Legacy Blender types (kept for JSON back-compat)
  vector3: '#6363C7',
  string:  '#63C7C7',
  shader:  '#63C763',
  geometry:'#00D6A3',
  rotation:'#a563c6',
  gradient:'#A1A1A1',
  float_curve: '#A1A1A1',
  unknown: '#FF4444', // Red for errors
};

export const UI_SIZES = {
  HEADER_HEIGHT: 32, 
  PORT_HEIGHT: 24,
  NODE_PADDING: 8,
  ROW_GAP: 4, 
};

export const DEFAULT_JSON_EXAMPLE = `{
  "nodes": [
    {
      "id": "uv_node",
      "name": "UV",
      "type": "tsl:UV",
      "position": { "x": -200, "y": 80 },
      "inputs": [],
      "outputs": [
        { "id": "uv_out", "name": "UV", "type": "vec2" }
      ]
    },
    {
      "id": "time_node",
      "name": "Time",
      "type": "tsl:Time",
      "position": { "x": -200, "y": 200 },
      "inputs": [],
      "outputs": [
        { "id": "time_out", "name": "Time", "type": "float" }
      ]
    },
    {
      "id": "sin_node",
      "name": "Sin",
      "type": "tsl:Sin",
      "position": { "x": 80, "y": 200 },
      "inputs": [
        { "id": "sin_a", "name": "A", "type": "float", "connected": true }
      ],
      "outputs": [
        { "id": "sin_out", "name": "Result", "type": "float" }
      ]
    },
    {
      "id": "base_color",
      "name": "Color",
      "type": "tsl:ColorNode",
      "position": { "x": -200, "y": 320 },
      "inputs": [
        { "id": "base_color_val", "name": "Color", "type": "color", "value": [0.2, 0.5, 1.0], "connected": false }
      ],
      "outputs": [
        { "id": "base_color_out", "name": "Color", "type": "color" }
      ]
    },
    {
      "id": "mix_node",
      "name": "Mix Color",
      "type": "tsl:MixColor",
      "position": { "x": 350, "y": 220 },
      "inputs": [
        { "id": "mix_a", "name": "Color A", "type": "color", "value": [0.2, 0.5, 1.0], "connected": true },
        { "id": "mix_b", "name": "Color B", "type": "color", "value": [1.0, 0.3, 0.1], "connected": false },
        { "id": "mix_t", "name": "Factor", "type": "float", "connected": true }
      ],
      "outputs": [
        { "id": "mix_out", "name": "Color", "type": "color" }
      ]
    },
    {
      "id": "mat_out",
      "name": "Material Output",
      "type": "tsl:MaterialOutput",
      "position": { "x": 640, "y": 200 },
      "inputs": [
        { "id": "colorNode", "name": "Color", "type": "color", "connected": true },
        { "id": "roughnessNode", "name": "Roughness", "type": "float", "value": 0.5, "connected": false },
        { "id": "metalnessNode", "name": "Metalness", "type": "float", "value": 0.0, "connected": false },
        { "id": "emissiveNode", "name": "Emissive", "type": "color", "connected": false },
        { "id": "normalNode", "name": "Normal", "type": "vec3", "connected": false },
        { "id": "opacityNode", "name": "Opacity", "type": "float", "value": 1.0, "connected": false },
        { "id": "positionNode", "name": "Position", "type": "vec3", "connected": false }
      ],
      "outputs": []
    }
  ],
  "connections": [
    { "from": "time_out", "to": "sin_a" },
    { "from": "base_color_out", "to": "mix_a" },
    { "from": "sin_out", "to": "mix_t" },
    { "from": "mix_out", "to": "colorNode" }
  ]
}`;