import React from 'react';
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { ConnectionLine } from './ConnectionLine';

describe('ConnectionLine', () => {
  it('renders an SVG <g> group', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const g = container.querySelector('g');
    expect(g).not.toBeNull();
  });

  it('renders two <path> elements (shadow + line)', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });

  it('shadow path uses dark stroke color', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const shadowPath = container.querySelectorAll('path')[0];
    expect(shadowPath.getAttribute('stroke')).toBe('#171717');
  });

  it('main path uses source port color when same type', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const mainPath = container.querySelectorAll('path')[1];
    expect(mainPath.getAttribute('stroke')).toBe('#A1A1A1');
  });

  it('uses gradient when source and target types differ', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="color" /></svg>
    );
    const defs = container.querySelector('defs');
    expect(defs).not.toBeNull();
    const gradient = defs!.querySelector('linearGradient');
    expect(gradient).not.toBeNull();
    const stops = gradient!.querySelectorAll('stop');
    expect(stops.length).toBe(2);
    // happy-dom may lowercase or omit hyphenated SVG attributes
    const stopColor0 = stops[0].getAttribute('stop-color') ?? stops[0].getAttribute('stopColor');
    const stopColor1 = stops[1].getAttribute('stop-color') ?? stops[1].getAttribute('stopColor');
    expect(stopColor0).toBe('#A1A1A1');
    expect(stopColor1).toBe('#C7C729');
  });

  it('gradient id is based on coordinates', () => {
    const { container } = render(
      <svg><ConnectionLine x1={10} y1={20} x2={200} y2={40} sourceType="float" targetType="color" /></svg>
    );
    const gradient = container.querySelector('linearGradient');
    expect(gradient!.id).toBe('grad-10-20-200-40');
  });

  it('no gradient when source and target types match', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const defs = container.querySelector('defs');
    expect(defs).toBeNull();
  });

  it('preview mode applies dashed stroke', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" isPreview /></svg>
    );
    const mainPath = container.querySelectorAll('path')[1];
    expect(mainPath.getAttribute('stroke-dasharray')).toBe('6 6');
  });

  it('preview mode has thicker shadow', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" isPreview /></svg>
    );
    const shadowPath = container.querySelectorAll('path')[0];
    expect(shadowPath.getAttribute('stroke-width')).toBe('5');
  });

  it('non-preview shadow width is 4', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const shadowPath = container.querySelectorAll('path')[0];
    expect(shadowPath.getAttribute('stroke-width')).toBe('4');
  });

  it('main path stroke width is 2', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const mainPath = container.querySelectorAll('path')[1];
    expect(mainPath.getAttribute('stroke-width')).toBe('2');
  });

  it('paths have no fill', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    container.querySelectorAll('path').forEach(path => {
      expect(path.getAttribute('fill')).toBe('none');
    });
  });

  it('paths use round linecap', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    container.querySelectorAll('path').forEach(path => {
      expect(path.getAttribute('stroke-linecap')).toBe('round');
    });
  });

  it('gradient uses url reference for main path stroke', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="color" /></svg>
    );
    const mainPath = container.querySelectorAll('path')[1];
    const stroke = mainPath.getAttribute('stroke');
    expect(stroke).toContain('url(#grad-');
  });

  it('no dasharray in non-preview mode', () => {
    const { container } = render(
      <svg><ConnectionLine x1={0} y1={0} x2={100} y2={50} sourceType="float" targetType="float" /></svg>
    );
    const mainPath = container.querySelectorAll('path')[1];
    expect(mainPath.getAttribute('stroke-dasharray')).toBeNull();
  });
});
