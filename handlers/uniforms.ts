import * as THREE from 'three';
import { uniform } from 'three/tsl';
import { TSLNodePlugin } from '../tslHandlerContext';

export const UniformFloatPlugin: TSLNodePlugin = {
  type: 'tsl:UniformFloat',
  def: {
    type: 'tsl:UniformFloat',
    name: 'Uniform Float',
    category: 'Inputs',
    description: 'A uniform float that can be updated from JavaScript.',
    tslFn: 'uniform',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Value', type: 'float', defaultValue: 0.0 },
    ],
    outputs: [
      { id: 'out', name: 'Uniform', type: 'float' },
    ],
  },
  build(ctx) {
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const uniformValue = uniform(typeof initVal === 'number' ? initVal : 0);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, uniformValue);
    }
  },
  export(ctx) {
    ctx.imports.add('uniform');
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const uniformExpr = `uniform(${typeof initVal === 'number' ? initVal.toFixed(4) : '0.0'})`;
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${uniformExpr};`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};

export const UniformVec3Plugin: TSLNodePlugin = {
  type: 'tsl:UniformVec3',
  def: {
    type: 'tsl:UniformVec3',
    name: 'Uniform Vec3',
    category: 'Inputs',
    description: 'A uniform vec3 that can be updated from JavaScript.',
    tslFn: 'uniform',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Value', type: 'vec3', defaultValue: [0, 0, 0] },
    ],
    outputs: [
      { id: 'out', name: 'Uniform', type: 'vec3' },
    ],
  },
  build(ctx) {
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const raw = Array.isArray(initVal) ? initVal : [0, 0, 0];
    const uniformValue = uniform(new THREE.Vector3(raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0));
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, uniformValue);
    }
  },
  export(ctx) {
    ctx.imports.add('uniform');
    ctx.imports.add('vec3');
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const raw = Array.isArray(initVal) ? initVal : [0, 0, 0];
    const v = [raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0];
    const uniformExpr = `uniform(new THREE.Vector3(${v[0]}, ${v[1]}, ${v[2]}))`;
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${uniformExpr};`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};

export const UniformColorPlugin: TSLNodePlugin = {
  type: 'tsl:UniformColor',
  def: {
    type: 'tsl:UniformColor',
    name: 'Uniform Color',
    category: 'Inputs',
    description: 'A uniform color that can be updated from JavaScript.',
    tslFn: 'uniform',
    isSource: true,
    inputs: [
      { id: 'value', name: 'Value', type: 'color', defaultValue: [1, 1, 1] },
    ],
    outputs: [
      { id: 'out', name: 'Uniform', type: 'color' },
    ],
  },
  build(ctx) {
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const raw = Array.isArray(initVal) ? initVal : [1, 1, 1];
    const uniformValue = uniform(new THREE.Color(raw[0] ?? 1, raw[1] ?? 1, raw[2] ?? 1));
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, uniformValue);
    }
  },
  export(ctx) {
    ctx.imports.add('uniform');
    ctx.imports.add('color');
    const inputPort = ctx.node.inputs?.[0];
    const initVal = inputPort?.value;
    const raw = Array.isArray(initVal) ? initVal : [1, 1, 1];
    const v = [raw[0] ?? 1, raw[1] ?? 1, raw[2] ?? 1];
    const uniformExpr = `uniform(new THREE.Color(${v[0]}, ${v[1]}, ${v[2]}))`;
    const varName = ctx.sanitizeId(ctx.node.id);
    ctx.lines.push(`const ${varName} = ${uniformExpr};`);
    for (const out of ctx.node.outputs ?? []) {
      ctx.outputVarMap.set(out.id, varName);
    }
    ctx.nodeVarMap.set(ctx.node.id, varName);
  },
};
