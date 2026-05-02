import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { render, fireEvent, screen } from '@testing-library/react';
import { NodePicker, NodePickerSelection } from './NodePicker';

describe('NodePicker', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true, writable: true });
  });

  it('opens as a rounded popup at the provided screen position', () => {
    const onClose = vi.fn();
    const onAddNode = vi.fn();
    const { container } = render(
      <NodePicker
        isOpen
        onClose={onClose}
        onAddNode={onAddNode}
        initialScreenPosition={{ x: 240, y: 180 }}
      />
    );

    const dialog = container.querySelector<HTMLElement>('.rounded-2xl')!;
    expect(dialog).not.toBeNull();
    expect(dialog.style.left).toBe('240px');
    expect(dialog.style.top).toBe('180px');
  });

  it('can be dragged by the title bar', () => {
    const onClose = vi.fn();
    const onAddNode = vi.fn();
    const { container } = render(
      <NodePicker
        isOpen
        onClose={onClose}
        onAddNode={onAddNode}
        initialScreenPosition={{ x: 240, y: 180 }}
      />
    );

    const dialog = container.querySelector<HTMLElement>('.rounded-2xl')!;
    const titleBar = screen.getByText('Add Node').closest('div')!;

    fireEvent.pointerDown(titleBar, { clientX: 260, clientY: 200, pointerId: 1, button: 0 });
    fireEvent.pointerMove(titleBar, { clientX: 360, clientY: 260, pointerId: 1, button: 0 });
    fireEvent.pointerUp(titleBar, { clientX: 360, clientY: 260, pointerId: 1, button: 0 });

    expect(dialog.style.left).toBe('340px');
    expect(dialog.style.top).toBe('240px');
  });

  it('adds a node and closes when an item is clicked', () => {
    const onClose = vi.fn();
    const onAddNode = vi.fn<(selection: NodePickerSelection) => void>();

    render(
      <NodePicker
        isOpen
        onClose={onClose}
        onAddNode={onAddNode}
        initialScreenPosition={{ x: 240, y: 180 }}
      />
    );

    fireEvent.click(screen.getAllByText('UV')[0]);

    expect(onAddNode).toHaveBeenCalledTimes(1);
    const selection = onAddNode.mock.calls[0][0];
    expect(selection.def.name).toBe('UV');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows nodeName.portName rows in connection mode', () => {
    const onClose = vi.fn();
    const onAddNode = vi.fn<(selection: NodePickerSelection) => void>();

    render(
      <NodePicker
        isOpen
        onClose={onClose}
        onAddNode={onAddNode}
        initialScreenPosition={{ x: 240, y: 180 }}
        connectionContext={{ anchorDirection: 'output' }}
      />
    );

    expect(screen.getByText('Sin.A')).toBeTruthy();
  });

  it('returns the selected port in connection mode', () => {
    const onClose = vi.fn();
    const onAddNode = vi.fn<(selection: NodePickerSelection) => void>();

    render(
      <NodePicker
        isOpen
        onClose={onClose}
        onAddNode={onAddNode}
        initialScreenPosition={{ x: 240, y: 180 }}
        connectionContext={{ anchorDirection: 'output' }}
      />
    );

    fireEvent.click(screen.getByText('Sin.A'));

    const selection = onAddNode.mock.calls[0][0];
    expect(selection.def.name).toBe('Sin');
    expect(selection.selectedPort?.name).toBe('A');
    expect(selection.selectedPortDirection).toBe('input');
  });
});
