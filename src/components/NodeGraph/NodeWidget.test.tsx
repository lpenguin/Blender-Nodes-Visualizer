import React from 'react';
import { describe, it, expect, vi } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeWidget } from './NodeWidget';
import { ToastProvider } from '../UI/Toast';
import { NodeData } from '../../types';

const wrap = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

const makeNode = (overrides: Partial<NodeData> = {}): NodeData => ({
  id: 'test_node',
  name: 'Test Node',
  type: 'tsl:Sin',
  position: { x: 50, y: 80 },
  size: { width: 200, height: 120 },
  outputs: [{ id: 'out1', name: 'Result', type: 'float' }],
  inputs: [
    { id: 'in1', name: 'A', type: 'float', value: 0.5, connected: false },
    { id: 'in2', name: 'Color', type: 'color', value: [1, 0, 0], connected: false },
  ],
  ...overrides,
});

describe('NodeWidget', () => {
  it('renders node name in header', () => {
    render(wrap(<NodeWidget data={makeNode()} />));
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('positions node at given coordinates', () => {
    const { container } = render(wrap(<NodeWidget data={makeNode()} />));
    const el = container.querySelector('[data-node-id="test_node"]') as HTMLElement;
    expect(el.style.left).toBe('50px');
    expect(el.style.top).toBe('80px');
  });

  it('applies selection ring when selected', () => {
    const { container } = render(wrap(<NodeWidget data={makeNode()} isSelected />));
    const el = container.querySelector('[data-node-id="test_node"]');
    expect(el!.className).toContain('ring-yellow-400');
  });

  it('no selection ring when not selected', () => {
    const { container } = render(wrap(<NodeWidget data={makeNode()} />));
    const el = container.querySelector('[data-node-id="test_node"]');
    expect(el!.className).toContain('border-neutral-700');
  });

  it('renders output ports with data attributes', () => {
    const { container } = render(wrap(<NodeWidget data={makeNode()} />));
    const outPort = container.querySelector('[data-port-id="out1"]');
    expect(outPort).not.toBeNull();
    expect(outPort!.getAttribute('data-port-direction')).toBe('output');
    expect(outPort!.getAttribute('data-port-type')).toBe('float');
  });

  it('renders input ports with data attributes', () => {
    const { container } = render(wrap(<NodeWidget data={makeNode()} />));
    const inPort = container.querySelector('[data-port-id="in1"]');
    expect(inPort).not.toBeNull();
    expect(inPort!.getAttribute('data-port-direction')).toBe('input');
    expect(inPort!.getAttribute('data-port-type')).toBe('float');
  });

  describe('port highlights', () => {
    it('active port gets highlight class', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} activePortId="out1" />));
      const outPort = container.querySelector('[data-port-id="out1"]');
      const dot = outPort!.querySelector('div');
      expect(dot!.className).toContain('scale-125');
      expect(dot!.className).toContain('ring-white');
    });

    it('hover-valid port gets green highlight', () => {
      const { container } = render(
        wrap(<NodeWidget data={makeNode()} hoveredPortId="in1" hoveredPortValid />)
      );
      const inPort = container.querySelector('[data-port-id="in1"]');
      const dot = inPort!.querySelector('div');
      expect(dot!.className).toContain('scale-125');
      expect(dot!.className).toContain('ring-emerald-300');
    });

    it('hover-invalid port gets red highlight', () => {
      const { container } = render(
        wrap(<NodeWidget data={makeNode()} hoveredPortId="in1" hoveredPortValid={false} />)
      );
      const inPort = container.querySelector('[data-port-id="in1"]');
      const dot = inPort!.querySelector('div');
      expect(dot!.className).toContain('scale-110');
      expect(dot!.className).toContain('ring-red-400');
    });

    it('idle port has no highlight ring', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} />));
      const outPort = container.querySelector('[data-port-id="out1"]');
      const dot = outPort!.querySelector('div');
      expect(dot!.className).not.toContain('scale-125');
      expect(dot!.className).not.toContain('ring-');
    });

    it('only matching port highlighted, others idle', () => {
      const { container } = render(
        wrap(<NodeWidget data={makeNode()} activePortId="out1" />)
      );
      const outDot = container.querySelector('[data-port-id="out1"]')!.querySelector('div');
      const inDot = container.querySelector('[data-port-id="in1"]')!.querySelector('div');
      expect(outDot!.className).toContain('scale-125');
      expect(inDot!.className).not.toContain('scale-125');
    });
  });

  describe('input value widgets', () => {
    it('shows numeric widget for disconnected float input', () => {
      render(wrap(<NodeWidget data={makeNode()} />));
      // The float value 0.5 should appear in the numeric editor
      expect(screen.getByText('0.5')).toBeInTheDocument();
    });

    it('hides widget for connected input', () => {
      const node = makeNode({
        inputs: [{ id: 'in1', name: 'A', type: 'float', value: 0.5, connected: true }],
      });
      render(wrap(<NodeWidget data={node} />));
      // Connected input only shows label, no value widget
      expect(screen.getByText('A')).toBeInTheDocument();
      // Value 0.5 should NOT be shown as editable
      const valEls = screen.queryAllByText('0.5');
      expect(valEls.length).toBe(0);
    });

    it('calls onInputValueChange when nudge button clicked', () => {
      const onChange = vi.fn();
      render(wrap(<NodeWidget data={makeNode()} onInputValueChange={onChange} />));
      // Find nudge buttons (the < and > buttons)
      const buttons = screen.getAllByRole('button');
      const nudgeRight = buttons.find(b => b.textContent === '>');
      expect(nudgeRight).toBeTruthy();
      fireEvent.click(nudgeRight!);
      expect(onChange).toHaveBeenCalledWith('test_node', 'in1', expect.any(Number));
    });

    it('renders color display for disconnected color input', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} />));
      // Color inputs with onChange render a ColorValueEditor with overlay div
      const colorDiv = container.querySelector('[style*="background"]');
      expect(colorDiv).not.toBeNull();
    });
  });

  describe('header colors by type', () => {
    it('math nodes get violet header', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode({ type: 'tsl:Sin' })} />));
      const header = container.querySelector('.bg-violet-900\\/70');
      expect(header).not.toBeNull();
    });

    it('material output gets dark header', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode({ type: 'tsl:MaterialOutput' })} />));
      const header = container.querySelector('.bg-neutral-800');
      expect(header).not.toBeNull();
    });

    it('input nodes get amber header', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode({ type: 'tsl:UV' })} />));
      const header = container.querySelector('.bg-amber-900\\/70');
      expect(header).not.toBeNull();
    });
  });

  describe('resize handles', () => {
    it('renders 8 resize handles', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} />));
      const handles = container.querySelectorAll('[data-resize-handle]');
      expect(handles.length).toBe(8);
    });

    it('resize handles have correct directions', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} />));
      const directions = Array.from(container.querySelectorAll('[data-resize-handle]'))
        .map(el => el.getAttribute('data-resize-handle'));
      expect(directions).toContain('nw');
      expect(directions).toContain('ne');
      expect(directions).toContain('sw');
      expect(directions).toContain('se');
      expect(directions).toContain('n');
      expect(directions).toContain('s');
      expect(directions).toContain('e');
      expect(directions).toContain('w');
    });
  });

  describe('output row', () => {
    it('shows output port name', () => {
      render(wrap(<NodeWidget data={makeNode()} />));
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('output port dot always shows connected style', () => {
      const { container } = render(wrap(<NodeWidget data={makeNode()} />));
      const outPort = container.querySelector('[data-port-id="out1"]');
      expect(outPort).not.toBeNull();
    });
  });

  describe('properties section', () => {
    it('renders property rows when present', () => {
      const node = makeNode({
        properties: [{ id: 'prop1', name: 'My Prop', type: 'float', value: 1.0 }],
      });
      render(wrap(<NodeWidget data={node} />));
      expect(screen.getByText('My Prop')).toBeInTheDocument();
    });

    it('property names are italic', () => {
      const node = makeNode({
        properties: [{ id: 'prop1', name: 'My Prop', type: 'float', value: 1.0 }],
      });
      const { container } = render(wrap(<NodeWidget data={node} />));
      const propLabel = screen.getByText('My Prop');
      expect(propLabel.className).toContain('italic');
    });
  });
});
