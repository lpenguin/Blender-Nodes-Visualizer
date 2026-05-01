import { NodeData, ConnectionData } from './types';

export type TSLValue = number | number[] | string | boolean | null;

export interface TSLPortDef {
  id: string;
  name: string;
  type: string;
  defaultValue?: TSLValue;
}

export interface TSLNodeDef {
  type: string;
  name: string;
  category: string;
  description: string;
  tslFn: string;
  inputs: TSLPortDef[];
  outputs: TSLPortDef[];
  isSource?: boolean;
  isMaterial?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

export interface NodeBuildContext {
  node: NodeData;
  def: TSLNodeDef;
  connections: ConnectionData[];
  outputVarMap: Map<string, TSLNode>;
  materialNodes: NodeData[];
  getInputValue(portId: string, portType: string, defaultValue: TSLValue): TSLNode;
  getInputRaw(portId: string, defaultValue: TSLValue): TSLNode;
  formatDefault(type: string, value: TSLValue): TSLNode;
}

export interface NodeExportContext {
  node: NodeData;
  def: TSLNodeDef;
  connections: ConnectionData[];
  outputVarMap: Map<string, string>;
  nodeVarMap: Map<string, string>;
  lines: string[];
  imports: Set<string>;
  materialNodes: NodeData[];
  getInputExpression(portId: string, portType: string, defaultValue: TSLValue): string;
  formatDefaultValue(type: string, value: TSLValue): string;
  sanitizeId(id: string): string;
}

export interface TSLNodePlugin {
  type: string;
  def: TSLNodeDef;
  build(ctx: NodeBuildContext): void;
  export(ctx: NodeExportContext): void;
}

const pluginMap = new Map<string, TSLNodePlugin>();

export function registerPlugin(plugin: TSLNodePlugin): void {
  pluginMap.set(plugin.type, plugin);
}

export function getPlugin(type: string): TSLNodePlugin | undefined {
  return pluginMap.get(type);
}
