import { registerPlugin, getPlugin, TSLNodePlugin, TSLNodeDef, NodeBuildContext, NodeExportContext, TSLValue } from '../tslHandlerContext';

export { getPlugin };
export type { NodeBuildContext, NodeExportContext, TSLValue };
import { builtinPlugins } from './builtinSources';
import { UniformFloatPlugin, UniformVec3Plugin, UniformColorPlugin } from './uniforms';
import { BooleanNodePlugin } from './boolean';
import { SplitXYZPlugin } from './splitXYZ';
import { CombineXYZPlugin } from './combineXYZ';
import { TextureSamplePlugin } from './textureSample';
import { MaterialOutputPlugin, PhysicalMaterialOutputPlugin } from './materialOutput';
import { GENERIC_TSL_DEFS } from './genericTslFunctions';

const allPlugins: TSLNodePlugin[] = [
  ...builtinPlugins,
  UniformFloatPlugin,
  UniformVec3Plugin,
  UniformColorPlugin,
  BooleanNodePlugin,
  SplitXYZPlugin,
  CombineXYZPlugin,
  TextureSamplePlugin,
  MaterialOutputPlugin,
  PhysicalMaterialOutputPlugin,
];

allPlugins.forEach(registerPlugin);

export const TSL_NODE_CATALOG: TSLNodeDef[] = [
  ...allPlugins.map(p => p.def),
  ...GENERIC_TSL_DEFS,
];

export const TSL_NODE_BY_TYPE = new Map<string, TSLNodeDef>(
  TSL_NODE_CATALOG.map(d => [d.type, d])
);

export const TSL_CATEGORIES = [
  'Inputs',
  'Math',
  'Vector',
  'Texture',
  'Built-in',
  'Color',
  'Utility',
  'Noise',
  'Output',
] as const;
