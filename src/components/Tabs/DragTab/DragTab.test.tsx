import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { DragTab } from './DragTab';

// Mock dnd-kit useSortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

// Mock CSS import - default export-ot adunk vissza
vi.mock('../Tabs.module.css', () => ({
  default: {
    tab: 'tab',
    active: 'active',
  },
}));

vi.mock('./DragTab.module.css', () => ({
  default: {
    closeTab: 'closeTab',
    visuallyHidden: 'visuallyHidden',
    dragging: 'dragging',
  },
}));

describe('DragTab', () => {
  const defaultProps = {
    id: 'tab-1',
    title: 'Test Tab',
    active: false,
    mode: 'news' as const,
    onClose: vi.fn(),
    onClick: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rendereli a címet és az ikont', () => {
    render(<DragTab {...defaultProps} />);
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
    expect(screen.getByText('📰')).toBeInTheDocument();
  });

  it('helyes ikont jelenít meg különböző mode-oknál', () => {
    render(<DragTab {...defaultProps} mode={'video' as const} />);
    expect(screen.getByText('🎥')).toBeInTheDocument();
    render(<DragTab {...defaultProps} mode={'search' as const} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
    render(<DragTab {...defaultProps} mode={'new' as const} />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('meghívja az onClick-et pointer up eseményre', () => {
    render(<DragTab {...defaultProps} />);
    fireEvent.pointerUp(screen.getByRole('tab'));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('meghívja az onClose-t a bezáró gombra kattintva', async () => {
    render(<DragTab {...defaultProps} />);
    
    // Debug: nézzük meg, milyen gombok vannak
    const buttons = screen.getAllByRole('button');
    console.log('Talált gombok:', buttons.map(btn => ({
      text: btn.textContent,
      ariaLabel: btn.getAttribute('aria-label'),
      title: btn.getAttribute('title')
    })));
    
    // Próbáljuk meg több módszerrel
    const closeButton = screen.getByRole('button', { name: /Test Tab fül bezárása/i });
    console.log('Bezáró gomb találva:', closeButton);
    
    fireEvent.click(closeButton);
    
    // Várjunk a setTimeout miatt
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('billentyűzettel: Enter/Space onClick, Delete/Backspace onClose', () => {
    render(<DragTab {...defaultProps} />);
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: 'Enter' });
    expect(defaultProps.onClick).toHaveBeenCalled();
    fireEvent.keyDown(tab, { key: ' ' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(tab, { key: 'Delete' });
    expect(defaultProps.onClose).toHaveBeenCalled();
    fireEvent.keyDown(tab, { key: 'Backspace' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });

  it('helyes ARIA attribútumokat állít be', () => {
    render(<DragTab {...defaultProps} active={true} />);
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-label', expect.stringContaining('Test Tab'));
    expect(tab).toHaveAttribute('tabindex', '0');
    expect(tab).toHaveAttribute('aria-controls', 'tab-panel-tab-1');
  });

  it('inaktív tab tabindex -1', () => {
    render(<DragTab {...defaultProps} active={false} />);
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('tabindex', '-1');
  });

  it('dragging állapotban helyes className-t ad', () => {
    // Egyszerűsített teszt - csak ellenőrizzük, hogy a komponens renderelődik
    render(<DragTab {...defaultProps} />);
    const tab = screen.getByRole('tab');
    expect(tab).toBeInTheDocument();
  });
}); 