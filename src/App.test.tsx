import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import App from './App';

describe('App JSON import/export', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 600,
    });

    originalCreateObjectURL = URL.createObjectURL.bind(URL);
    originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('renders the default example graph on load', () => {
    const { container } = render(<App />);

    expect(container.querySelector('[data-node-id="uv_node"]')).not.toBeNull();
    expect(container.querySelector('[data-node-id="mat_out"]')).not.toBeNull();
  });

  it('imports a graph from a JSON file', async () => {
    const { container, getByTitle, getByText } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    const file = new File([
      JSON.stringify({
        nodes: [
          {
            id: 'imported_node',
            name: 'Imported Node',
            type: 'tsl:Time',
            position: { x: 10, y: 20 },
            inputs: [],
            outputs: [{ id: 'imported_out', name: 'Time', type: 'float' }],
          },
        ],
        connections: [],
      }),
    ], 'imported-graph.json', { type: 'application/json' });

    fireEvent.click(getByTitle('File menu'));
    fireEvent.click(getByText('Import JSON'));
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector('[data-node-id="imported_node"]')).not.toBeNull();
    });
    expect(container.querySelector('[data-node-id="uv_node"]')).toBeNull();
  });

  it('shows a parse error when importing invalid JSON', async () => {
    const { container } = render(<App />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    const file = new File(['{ invalid json'], 'broken.json', { type: 'application/json' });

    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.textContent).toContain('Error:');
    });
    expect(container.textContent).toContain('JSON Parse error:');
  });

  it('exports the current graph as JSON', () => {
    const createObjectURL = vi.fn(() => 'blob:graph-json');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => undefined);

    const { getByTitle, getByText } = render(<App />);

    fireEvent.click(getByTitle('File menu'));
    fireEvent.click(getByText('Export JSON'));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:graph-json');

    const appendedAnchor = appendChildSpy.mock.calls.find(
      (call) => call[0] instanceof HTMLAnchorElement,
    )?.[0] as HTMLAnchorElement | undefined;
    expect(appendedAnchor).toBeDefined();
    expect(appendedAnchor?.download).toBe('graph.json');
    expect(appendedAnchor?.href).toBe('blob:graph-json');

    clickSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('shows undo and redo in the edit menu', () => {
    const { getByText, getByTitle } = render(<App />);

    fireEvent.click(getByTitle('Edit menu'));

    expect(getByText('Undo')).toBeTruthy();
    expect(getByText('Redo')).toBeTruthy();
    expect(getByText('Ctrl-Z')).toBeTruthy();
    expect(getByText('Ctrl-Y')).toBeTruthy();
  });

  it('supports undo and redo shortcuts for graph edits', async () => {
    const { container, getByTitle, getByText } = render(<App />);
    const initialCount = container.querySelectorAll('[data-node-id]').length;
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File([
      JSON.stringify({
        nodes: [
          {
            id: 'imported_node',
            name: 'Imported Node',
            type: 'tsl:Time',
            position: { x: 10, y: 20 },
            inputs: [],
            outputs: [{ id: 'imported_out', name: 'Time', type: 'float' }],
          },
        ],
        connections: [],
      }),
    ], 'imported-graph.json', { type: 'application/json' });

    fireEvent.click(getByTitle('File menu'));
    fireEvent.click(getByText('Import JSON'));
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelectorAll('[data-node-id]').length).toBe(1);
    });

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(container.querySelectorAll('[data-node-id]').length).toBe(initialCount);

    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(container.querySelectorAll('[data-node-id]').length).toBe(1);

    fireEvent.click(getByTitle('Edit menu'));
    fireEvent.click(getByText('Undo'));
    expect(container.querySelectorAll('[data-node-id]').length).toBe(initialCount);
  });

  it('creates and connects a node under the mouse from the empty-drop picker flow', async () => {
    const { container } = render(<App />);

    const outputPort = container.querySelector('[data-port-id="uv_out"]');
    expect(outputPort).not.toBeNull();

    const canvas = container.querySelector('.touch-none')!;
    fireEvent.pointerDown(outputPort!, { clientX: 0, clientY: 0, pointerId: 1, button: 0, pointerType: 'mouse' });
    fireEvent.pointerMove(canvas, { clientX: 520, clientY: 260, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(canvas, { clientX: 520, clientY: 260, pointerId: 1, button: 0, pointerType: 'mouse' });

    const pickerRow = await screen.findByText('Sin.A');
    fireEvent.click(pickerRow);

    await waitFor(() => {
      expect(container.querySelector('[data-node-id="sin"]')).not.toBeNull();
    });

    const createdNode = container.querySelector('[data-node-id="sin"]');
    expect(createdNode).not.toBeNull();
    expect(createdNode?.getAttribute('style') ?? '').toContain('left: 520px');
    expect(createdNode?.getAttribute('style') ?? '').toContain('top: 260px');

    const connectionPaths = container.querySelectorAll('svg path');
    expect(connectionPaths.length).toBeGreaterThan(0);
  });
});
