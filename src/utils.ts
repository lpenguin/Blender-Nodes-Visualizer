
import { TYPE_COLORS } from './constants';
import { DataType, GraphSchema, NodeData, NodePort, NodeProperty } from './types';

export interface GradientStop { pos: number; color: number[] }

// --- Color Helpers ---

export const getPortColor = (type: DataType): string => {
  return TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.float; // Default to grey/float if unknown
};

export const isValidVector3 = (val: unknown): boolean => {
  return Array.isArray(val) && val.length === 3 && (val as number[]).every(n => typeof n === 'number');
};

export const isValidRotation = (val: unknown): boolean => {
  return Array.isArray(val) && val.length === 3 && (val as number[]).every(n => typeof n === 'number');
};

export const isValidColor = (val: unknown): boolean => {
  return Array.isArray(val) && (val.length === 3 || val.length === 4) && (val as number[]).every(n => typeof n === 'number');
};

export const isValidGradient = (val: unknown): boolean => {
  if (!Array.isArray(val)) return false;
  return val.every(stop =>
    typeof stop === 'object' &&
    stop !== null &&
    typeof (stop as GradientStop).pos === 'number' &&
    isValidColor((stop as GradientStop).color)
  );
};

export const rgbToHex = (color: number[]): string => {
  const toHex = (c: number): string => {
    const hex = Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`;
};

export const hexToRgb = (hex: string, alpha?: number): number[] | null => {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const rgb = [
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  ];

  return typeof alpha === 'number' ? [...rgb, alpha] : rgb;
};

export const generateGradientCSS = (stops: GradientStop[]): string => {
  if (stops.length === 0) return '#4b4b4b';

  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const cssStops = sorted.map(stop => {
    const pos = Math.max(0, Math.min(1, stop.pos)) * 100;
    const [r, g, b] = stop.color;
    const c = `rgb(${String(Math.round(r * 255))}, ${String(Math.round(g * 255))}, ${String(Math.round(b * 255))})`;
    return `${c} ${String(pos)}%`;
  });

  return `linear-gradient(90deg, ${cssStops.join(', ')})`;
};

// --- Geometry Helpers ---

const getInputHeight = (port: NodePort): number => {
    const BASE_H = 24;
    if (port.connected) return BASE_H;
    
    switch (port.type) {
        case 'float': return 28;
        case 'int': return 28;
        case 'color': return 24;
        case 'gradient': return 72;
        case 'float_curve': return 168;
        case 'vector3': return BASE_H; 
        case 'rotation': return BASE_H;
        default: return BASE_H;
    }
};

const getPropertyHeight = (prop: NodeProperty): number => {
    const BASE_H = 24;
    switch (prop.type) {
        case 'gradient': return 72;
        case 'float_curve': return 168;
        default: return BASE_H;
    }
};

export const calculateNodeContentSize = (node: NodeData): { width: number; height: number } => {
  const HEADER_H = 32;
  const PADDING = 16; // Top + Bottom
  const GAP = 4;
  
  let contentHeight = 0;
  
  // Outputs
  if (node.outputs && node.outputs.length > 0) {
      contentHeight += node.outputs.length * (24 + GAP) + 5; 
  }

  // Properties
  if (node.properties && node.properties.length > 0) {
      node.properties.forEach(prop => {
          contentHeight += getPropertyHeight(prop) + GAP;
      });
      contentHeight += 5; // spacing
  }
  
  // Inputs
  if (node.inputs && node.inputs.length > 0) {
      node.inputs.forEach(input => {
          contentHeight += getInputHeight(input) + GAP;
      });
  }
  
  const height = HEADER_H + PADDING + contentHeight;
  const width = 200; // Default width

  return { width, height };
};

export const calculateBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const dist = Math.abs(x2 - x1) * 0.5;
  const cp1x = x1 + Math.max(dist, 50); 
  const cp1y = y1;
  const cp2x = x2 - Math.max(dist, 50);
  const cp2y = y2;

  return `M ${String(x1)} ${String(y1)} C ${String(cp1x)} ${String(cp1y)}, ${String(cp2x)} ${String(cp2y)}, ${String(x2)} ${String(y2)}`;
};

export const applyConnectionState = (schema: GraphSchema): GraphSchema => {
  const connectedInputs = new Set(schema.connections.map(connection => connection.to));

  const nodes = schema.nodes.map((node) => {
    const normalizedNode: NodeData = {
      ...node,
      inputs: node.inputs?.map((input) => ({
        ...input,
        connected: connectedInputs.has(input.id),
      })),
    };

    return {
      ...normalizedNode,
      size: normalizedNode.size ?? calculateNodeContentSize(normalizedNode),
    };
  });

  return {
    ...schema,
    nodes,
  };
};

export const parseGraphJSON = (json: string): { schema: GraphSchema | null; error: string | null } => {
  try {
    const parsed = JSON.parse(json) as GraphSchema;
    if (!Array.isArray(parsed.nodes)) {
      return { schema: null, error: "Invalid JSON: 'nodes' array missing." };
    }
    
    return { schema: applyConnectionState(parsed), error: null };
  } catch (e: unknown) {
    return { schema: null, error: (e as Error).message || "Invalid JSON syntax." };
  }
};
