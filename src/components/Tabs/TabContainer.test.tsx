import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { TabContainer } from './TabContainer';
import { Tab } from '../../types';
import { useUI } from '../../contexts/UIContext';

// Mock the child components
vi.mock('./DraggableTabs', () => ({
  DraggableTabs: ({ tabs, onAddTab, onCloseTab, onActivateTab }: any) => (
    <div data-testid="draggable-tabs">
      {tabs.map((tab: Tab) => (
        <button
          key={tab.id}
          data-testid={`tab-${tab.id}`}
          onClick={() => onActivateTab(tab.id)}
        >
          {tab.title}
          <button
            data-testid={`close-tab-${tab.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
          >
            ×
          </button>
        </button>
      ))}
      <button data-testid="add-tab" onClick={onAddTab}>
        +
      </button>
    </div>
  ),
}));

vi.mock('../NavigationBar', () => ({
  NavigationBar: ({ onBack, onForward, onRefresh, onSearch, onClearSearch }: any) => (
    <div data-testid="navigation-bar">
      <button data-testid="nav-back" onClick={onBack}>Back</button>
      <button data-testid="nav-forward" onClick={onForward}>Forward</button>
      <button data-testid="nav-refresh" onClick={onRefresh}>Refresh</button>
      <button data-testid="nav-search" onClick={() => onSearch?.('test', [])}>Search</button>
      <button data-testid="nav-clear-search" onClick={onClearSearch}>Clear</button>
    </div>
  ),
}));

vi.mock('../Content/Content', () => ({
  Content: ({ activeTabId, tabs, onChangeTabMode }: any) => (
    <div data-testid="content">
      <div data-testid="active-tab-id">{activeTabId}</div>
      <div data-testid="tabs-count">{tabs.length}</div>
      {onChangeTabMode && (
        <button
          data-testid="change-mode"
          onClick={() => onChangeTabMode(activeTabId, 'video')}
        >
          Change Mode
        </button>
      )}
    </div>
  ),
}));

vi.mock('../CategoryBar/TabCategoryBar', () => ({
  default: ({ categories, selectedCategory, onCategorySelect }: any) => (
    <div data-testid="category-bar">
      {categories.map((category: string) => (
        <button
          key={category}
          data-testid={`category-${category}`}
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  ),
}));

// Mock debug tools
vi.mock('../../utils/debugTools/debugTools', () => ({
  useDebugRender: vi.fn(),
}));

// Mock UIContext
vi.mock('../../contexts/UIContext', () => ({
  useUI: vi.fn(),
}));

describe('TabContainer', () => {
  const mockTabs: Tab[] = [
    {
      id: 'tab-1',
      title: 'Home',
      active: true,
      mode: 'news',
      filters: {},
    },
    {
      id: 'tab-2',
      title: 'Search',
      active: false,
      mode: 'search',
      filters: { searchTerm: 'test' },
    },
  ];

  const defaultProps = {
    activeTabId: 'tab-1',
    tabs: mockTabs,
    onAddTab: vi.fn(),
    onCloseTab: vi.fn(),
    onActivateTab: vi.fn(),
    onReorderTabs: vi.fn(),
    onChangeTabMode: vi.fn(),
    onShowNewNews: vi.fn(),
    isLeftPanelCollapsed: false,
    isRightPanelCollapsed: false,
    onToggleLeftPanel: vi.fn(),
    onToggleRightPanel: vi.fn(),
    isSearchMode: false,
    searchTerm: '',
    searchResults: [],
    onSearch: vi.fn(),
    onClearSearch: vi.fn(),
    enableFrontendSearch: false,
  };

  const mockUIContext = {
    uiState: {
      showCategoryBar: true,
    },
    dispatch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUI as any).mockReturnValue(mockUIContext);
  });

  const renderTabContainer = (props = {}) => {
    return render(<TabContainer {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render all main components', () => {
      renderTabContainer();

      expect(screen.getByTestId('draggable-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
      expect(screen.getByTestId('category-bar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render tabs correctly', () => {
      renderTabContainer();

      expect(screen.getByTestId('tab-tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-tab-2')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      // Use getAllByText to handle multiple "Search" elements (tab and nav button)
      expect(screen.getAllByText('Search')).toHaveLength(2);
    });

    it('should render add tab button', () => {
      renderTabContainer();

      expect(screen.getByTestId('add-tab')).toBeInTheDocument();
    });

    it('should render close buttons for each tab', () => {
      renderTabContainer();

      expect(screen.getByTestId('close-tab-tab-1')).toBeInTheDocument();
      expect(screen.getByTestId('close-tab-tab-2')).toBeInTheDocument();
    });
  });

  describe('Tab Management', () => {
    it('should call onAddTab when add button is clicked', () => {
      const onAddTab = vi.fn();
      renderTabContainer({ onAddTab });

      fireEvent.click(screen.getByTestId('add-tab'));

      expect(onAddTab).toHaveBeenCalledTimes(1);
    });

    it('should call onCloseTab when close button is clicked', () => {
      const onCloseTab = vi.fn();
      renderTabContainer({ onCloseTab });

      fireEvent.click(screen.getByTestId('close-tab-tab-1'));

      expect(onCloseTab).toHaveBeenCalledWith('tab-1');
    });

    it('should call onActivateTab when tab is clicked', () => {
      const onActivateTab = vi.fn();
      renderTabContainer({ onActivateTab });

      fireEvent.click(screen.getByTestId('tab-tab-2'));

      expect(onActivateTab).toHaveBeenCalledWith('tab-2');
    });

    it('should not call onCloseTab when clicking on tab (not close button)', () => {
      const onCloseTab = vi.fn();
      renderTabContainer({ onCloseTab });

      fireEvent.click(screen.getByTestId('tab-tab-1'));

      expect(onCloseTab).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should call navigation handlers when buttons are clicked', () => {
      const onBack = vi.fn();
      const onForward = vi.fn();
      const onRefresh = vi.fn();
      const onSearch = vi.fn();
      const onClearSearch = vi.fn();

      renderTabContainer({
        onBack,
        onForward,
        onRefresh,
        onSearch,
        onClearSearch,
      });

      fireEvent.click(screen.getByTestId('nav-back'));
      fireEvent.click(screen.getByTestId('nav-forward'));
      fireEvent.click(screen.getByTestId('nav-refresh'));
      fireEvent.click(screen.getByTestId('nav-search'));
      fireEvent.click(screen.getByTestId('nav-clear-search'));

      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onForward).toHaveBeenCalledTimes(1);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test', []);
      expect(onClearSearch).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh with content refresh function', async () => {
      const onRefresh = vi.fn();
      renderTabContainer({ onRefresh });

      fireEvent.click(screen.getByTestId('nav-refresh'));

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Category Bar', () => {
    it('should render categories correctly', () => {
      renderTabContainer();

      expect(screen.getByTestId('category-Politics')).toBeInTheDocument();
      expect(screen.getByTestId('category-Economy')).toBeInTheDocument();
      expect(screen.getByTestId('category-Business')).toBeInTheDocument();
      expect(screen.getByTestId('category-Sports')).toBeInTheDocument();
      expect(screen.getByTestId('category-World')).toBeInTheDocument();
      expect(screen.getByTestId('category-Education')).toBeInTheDocument();
      expect(screen.getByTestId('category-Environment')).toBeInTheDocument();
    });

    it('should call onCategorySelect when category is clicked', () => {
      const onCategorySelect = vi.fn();
      renderTabContainer({ onCategorySelect });

      fireEvent.click(screen.getByTestId('category-Politics'));

      expect(onCategorySelect).toHaveBeenCalledWith('Politics');
    });
  });

  describe('Content', () => {
    it('should pass active tab ID to content', () => {
      renderTabContainer();

      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });

    it('should pass tabs count to content', () => {
      renderTabContainer();

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('2');
    });

    it('should call onChangeTabMode when change mode button is clicked', () => {
      const onChangeTabMode = vi.fn();
      renderTabContainer({ onChangeTabMode });

      fireEvent.click(screen.getByTestId('change-mode'));

      expect(onChangeTabMode).toHaveBeenCalledWith('tab-1', 'video');
    });
  });

  describe('Props Handling', () => {
    it('should handle different active tab IDs', () => {
      renderTabContainer({ activeTabId: 'tab-2' });

      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-2');
    });

    it('should handle empty tabs array', () => {
      renderTabContainer({ tabs: [] });

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('0');
    });

    it('should handle search mode', () => {
      renderTabContainer({
        isSearchMode: true,
        searchTerm: 'test search',
        searchResults: [],
      });

      // Content should still render
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle frontend search enabled', () => {
      renderTabContainer({ enableFrontendSearch: true });

      // Navigation bar should have search functionality
      expect(screen.getByTestId('nav-search')).toBeInTheDocument();
      expect(screen.getByTestId('nav-clear-search')).toBeInTheDocument();
    });
  });

  describe('UI State Integration', () => {
    it('should show category bar when uiState.showCategoryBar is true', () => {
      renderTabContainer();

      expect(screen.getByTestId('category-bar')).toBeInTheDocument();
    });

    it('should hide category bar when uiState.showCategoryBar is false', () => {
      const mockUIContextHidden = {
        uiState: {
          showCategoryBar: false,
        },
        dispatch: vi.fn(),
      };

      (useUI as any).mockReturnValue(mockUIContextHidden);

      render(<TabContainer {...defaultProps} />);

      expect(screen.queryByTestId('category-bar')).not.toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props are the same', () => {
      const { rerender } = renderTabContainer();

      // Re-render with same props
      rerender(<TabContainer {...defaultProps} />);

      // Should still have the same content
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });

    it('should re-render when active tab changes', () => {
      const { rerender } = renderTabContainer();

      // Re-render with different active tab
      rerender(<TabContainer {...defaultProps} activeTabId="tab-2" />);

      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-2');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional props gracefully', () => {
      const minimalProps = {
        activeTabId: 'tab-1',
        tabs: mockTabs,
        onAddTab: vi.fn(),
        onCloseTab: vi.fn(),
        onActivateTab: vi.fn(),
      };

      expect(() => {
        render(<TabContainer {...minimalProps} />);
      }).not.toThrow();
    });

    it('should handle null/undefined props', () => {
      const propsWithNulls = {
        ...defaultProps,
        onReorderTabs: undefined,
        onChangeTabMode: undefined,
        onShowNewNews: undefined,
        searchResults: undefined,
      };

      expect(() => {
        render(<TabContainer {...propsWithNulls} />);
      }).not.toThrow();
    });
  });
}); 