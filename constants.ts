
import { DataType } from './types';

// Blender Shader Editor Colors
export const TYPE_COLORS: Record<string, string> = {
  float: '#A1A1A1', // Grey
  vector3: '#6363C7', // Purple
  color: '#C7C729', // Yellow
  string: '#63C7C7', // Cyan/Blueish
  shader: '#63C763', // Green (Common in Blender)
  geometry: '#00D6A3', // Blender Geometry (Turquoise-Green)
  rotation: '#a563c6', // Euler Angles (Purple-Pink)
  gradient: '#A1A1A1', // Gradient usually has grey inputs/widgets
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
      "id": "noise_tex",
      "name": "Noise Texture",
      "type": "ShaderNodeTexNoise",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 220, "height": 260 },
      "inputs": [
        { "id": "noise_vec", "name": "Vector", "type": "vector3", "connected": false, "hide_port": false, "value": [1.2, 0.5, 3.1] },
        { "id": "noise_scale", "name": "Scale", "type": "float", "value": 12.5, "connected": false },
        { "id": "noise_detail", "name": "Detail", "type": "float", "value": 5.0, "connected": false },
        { "id": "noise_rough", "name": "Roughness", "type": "float", "value": 0.5, "connected": false },
        { "id": "noise_dist", "name": "Distortion", "type": "float", "value": 0.0, "connected": false }
      ],
      "outputs": [
        { "id": "noise_fac", "name": "Fac", "type": "float" },
        { "id": "noise_col", "name": "Color", "type": "color" }
      ]
    },
    {
      "id": "mapping_node",
      "name": "Mapping",
      "type": "ShaderNodeMapping",
      "position": { "x": -150, "y": 100 },
      "size": { "width": 180, "height": 220 },
      "inputs": [
          { "id": "map_vec", "name": "Vector", "type": "vector3", "connected": false, "value": [0, 0, 0] },
          { "id": "map_rot", "name": "Rotation", "type": "rotation", "connected": false, "value": [0, 45, 90] },
          { "id": "map_scale", "name": "Scale", "type": "vector3", "connected": false, "value": [1, 1, 1] }
      ],
      "outputs": [
          { "id": "map_out", "name": "Vector", "type": "vector3" }
      ]
    },
    {
      "id": "curve_node",
      "name": "Float Curve",
      "type": "ShaderNodeFloatCurve",
      "position": { "x": 400, "y": 100 },
      "size": { "width": 240, "height": 300 },
      "inputs": [
        { "id": "curve_fac", "name": "Factor", "type": "float", "connected": true },
        { 
          "id": "curve_def", 
          "name": "Curve", 
          "type": "float_curve", 
          "hide_port": true,
          "connected": false,
          "value": [
            { "x": 0.0, "y": 0.2 },
            { "x": 0.3, "y": 0.8 },
            { "x": 0.7, "y": 0.4 },
            { "x": 1.0, "y": 0.9 }
          ]
        }
      ],
      "outputs": [
        { "id": "curve_out", "name": "Value", "type": "float" }
      ]
    },
    {
        "id": "output_node",
        "name": "Material Output",
        "type": "ShaderNodeOutputMaterial",
        "position": { "x": 700, "y": 150 },
        "size": { "width": 160, "height": 100 },
        "inputs": [
            { "id": "mat_surf", "name": "Surface", "type": "shader", "connected": true }
        ],
        "outputs": []
    }
  ],
  "connections": [
    { "from": "noise_fac", "to": "curve_fac" },
    { "from": "curve_out", "to": "mat_surf" },
    { "from": "map_out", "to": "noise_vec" }
  ]
}`;