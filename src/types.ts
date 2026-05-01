
export type DataType = string;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NodePort {
  id: string;
  name: string;
  type: DataType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  connected?: boolean;
  hide_port?: boolean;
}

export interface NodeProperty {
  id?: string;
  name: string;
  type: DataType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
}

export interface NodeData {
  id: string;
  name: string;
  type: string;
  position: Position;
  size?: Size;
  inputs?: NodePort[];
  outputs?: NodePort[];
  properties?: NodeProperty[];
}

export interface ConnectionData {
  from: string;
  to: string;
}

export interface GraphSchema {
  nodes: NodeData[];
  connections: ConnectionData[];
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}