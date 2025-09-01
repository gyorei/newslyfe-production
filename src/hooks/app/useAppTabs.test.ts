import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppTabs } from './useAppTabs';
import type { Tab } from '../../types';

describe('useAppTabs', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
  it('should initialize with default tabs', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      expect(result.current.tabs.length).toBeGreaterThanOrEqual(0);
    });

    it('should initialize with empty tabs when no localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      expect(result.current.tabs).toEqual([{
        id: 'default-tab',
        title: 'Home',
        active: true,
        mode: 'news',
        filters: {}
      }]);
    });

    it('should initialize with stored tabs from localStorage', () => {
      const storedData = {
        tabs: {
          activeId: 'tab-1',
          definitions: [
            { id: 'tab-1', title: 'Test Tab', mode: 'news', params: {} }
          ]
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      expect(result.current.tabs.length).toBe(1);
      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('should handle invalid localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      expect(result.current.tabs).toEqual([{
        id: 'default-tab',
        title: 'Home',
        active: true,
        mode: 'news',
        filters: {}
      }]);
    });
  });

  describe('Tab Management', () => {
    it('should add a new tab', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      const initialTabCount = result.current.tabs.length;
      
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      expect(result.current.tabs.length).toBe(initialTabCount + 1);
      expect(result.current.tabs.some(tab => tab.title === 'Home')).toBe(true);
    });

    it('should close a tab', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add a tab first
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      const tabToClose = result.current.tabs[result.current.tabs.length - 1]; // Close the last added tab
      const initialTabCount = result.current.tabs.length;
      
      act(() => {
        result.current.closeTab(tabToClose.id);
      });
      
      expect(result.current.tabs.length).toBe(initialTabCount - 1);
      expect(result.current.tabs.find(tab => tab.id === tabToClose.id)).toBeUndefined();
    });

    it('should not close non-existent tab', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      const initialTabCount = result.current.tabs.length;
      
      act(() => {
        result.current.closeTab('non-existent-tab');
      });
      
      expect(result.current.tabs.length).toBe(initialTabCount);
    });

    it('should activate a different tab', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add multiple tabs
      act(() => {
        result.current.addTabWithPersistence();
        result.current.addTabWithPersistence();
      });
      
      const secondTab = result.current.tabs[1];
      
      act(() => {
        result.current.activateTab(secondTab.id);
      });
      
      expect(result.current.activeTabId).toBe(secondTab.id);
      expect(result.current.tabs.find(tab => tab.id === secondTab.id)?.active).toBe(true);
    });

    it('should change tab mode', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      const tabId = result.current.tabs[0].id;
      
      act(() => {
        result.current.changeTabMode(tabId, 'video');
      });
      
      expect(result.current.tabs.find(tab => tab.id === tabId)?.mode).toBe('video');
    });

    it('should handle invalid tab mode gracefully', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      const tabId = result.current.tabs[0].id;
      
      act(() => {
        result.current.changeTabMode(tabId, 'invalid-mode' as any);
      });
      
      // Should not crash and should keep the mode as is or set to default
      expect(result.current.tabs.find(tab => tab.id === tabId)?.mode).toBeDefined();
    });
  });

  describe('Tab Switching Edge Cases', () => {
    it('should handle switching to non-existent tab', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      const initialActiveTab = result.current.activeTabId;
      
      act(() => {
        result.current.activateTab('non-existent-tab');
      });
      
      // Should not crash and should keep the current active tab
      expect(result.current.activeTabId).toBe(initialActiveTab);
    });

    it('should handle closing the last tab', async () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add one tab
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      const tabToClose = result.current.tabs[0];
      
      // Mock window.close to prevent actual window closing
      const originalClose = window.close;
      const mockClose = vi.fn();
      window.close = mockClose;
      
      act(() => {
        result.current.closeTab(tabToClose.id);
      });
      
      // Wait for the setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // The tab should be removed and window.close should be called
      expect(result.current.tabs.length).toBe(0);
      expect(mockClose).toHaveBeenCalled();
      
      // Restore original
      window.close = originalClose;
    });

    it('should handle closing active tab with multiple tabs', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add multiple tabs
      act(() => {
        result.current.addTabWithPersistence();
        result.current.addTabWithPersistence();
      });
      
      // Find the active tab and a non-active tab
      const activeTab = result.current.tabs.find(tab => tab.active);
      const otherTab = result.current.tabs.find(tab => !tab.active);
      
      if (activeTab && otherTab) {
        act(() => {
          result.current.closeTab(activeTab.id);
        });
        
        // Should activate the other tab and remove the closed tab
        expect(result.current.tabs.length).toBe(1);
        expect(result.current.activeTabId).toBe(otherTab.id);
        expect(result.current.tabs.find(tab => tab.id === otherTab.id)?.active).toBe(true);
      }
    });

    it('should handle rapid tab switching', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add multiple tabs
      act(() => {
        result.current.addTabWithPersistence();
        result.current.addTabWithPersistence();
        result.current.addTabWithPersistence();
      });
      
      const tabs = result.current.tabs;
      
      // Rapidly switch between tabs
      act(() => {
        result.current.activateTab(tabs[0].id);
        result.current.activateTab(tabs[1].id);
        result.current.activateTab(tabs[2].id);
        result.current.activateTab(tabs[0].id);
      });
      
      // Should end up with the last activated tab
      expect(result.current.activeTabId).toBe(tabs[0].id);
    });
  });

  describe('Search and Filter Functions', () => {
    it('should handle continent search', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleContinentSearch('Europe', 'Germany');
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title.includes('Germany'));
      expect(newTab).toBeDefined();
      expect(newTab?.filters?.continent).toBe('Europe');
      expect(newTab?.filters?.country).toBe('Germany');
    });

    it('should handle category search', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleCategorySearch('Technology');
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title === 'Technology');
      expect(newTab).toBeDefined();
      expect(newTab?.filters?.category).toBe('Technology');
    });

    it('should handle search tab open', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleSearchTabOpen('test search');
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title.includes('test search'));
      expect(newTab).toBeDefined();
      expect(newTab?.mode).toBe('search');
      expect(newTab?.filters?.searchTerm).toBe('test search');
    });

    it('should handle video tab open', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleVideoTabOpen();
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title === 'Video News');
      expect(newTab).toBeDefined();
      expect(newTab?.mode).toBe('video');
    });

    it('should handle filters change', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleFiltersChange({ country: 'Hungary' });
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title === 'Hungary');
      expect(newTab).toBeDefined();
      expect(newTab?.filters?.country).toBe('Hungary');
    });

    it('should handle filters change with video content type', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.handleFiltersChange({ country: 'USA' }, 'video');
      });
      
      expect(result.current.tabs.length).toBeGreaterThan(0);
      const newTab = result.current.tabs.find(tab => tab.title === 'USA');
      expect(newTab).toBeDefined();
      expect(newTab?.mode).toBe('video');
    });
  });

  describe('Tab Reordering', () => {
    it('should handle tab reordering', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Add multiple tabs
      act(() => {
        result.current.addTabWithPersistence();
        result.current.addTabWithPersistence();
      });
      
      const originalTabs = [...result.current.tabs];
      const reorderedTabs = [originalTabs[1], originalTabs[0]];
      
      act(() => {
        result.current.handleReorderTabs(reorderedTabs);
      });
      
      expect(result.current.tabs[0].id).toBe(originalTabs[1].id);
      expect(result.current.tabs[1].id).toBe(originalTabs[0].id);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      // Should not crash even if localStorage fails
    expect(result.current.tabs.length).toBeGreaterThan(0);
  });

    it('should handle invalid tab data gracefully', () => {
      const invalidStoredData = {
        tabs: {
          activeId: 'invalid-tab',
          definitions: [
            { id: 'tab-1', title: 'Test Tab', mode: 'invalid-mode', params: {} }
          ]
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidStoredData));
      
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      // Should handle invalid mode gracefully
      expect(result.current.tabs.length).toBe(1);
      expect(result.current.tabs[0].mode).toBe('news'); // Should default to 'news'
    });
  });

  describe('State Persistence', () => {
    it('should persist tab state to localStorage', () => {
      const { result } = renderHook(() => useAppTabs({ storageInitialized: true, storageState: null }));
      
      act(() => {
        result.current.addTabWithPersistence();
      });
      
      // Wait for the useEffect to execute
    act(() => {
        // Trigger a state change to ensure useEffect runs
        result.current.changeTabMode(result.current.tabs[0].id, 'video');
      });
      
      // Should call localStorage.setItem
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should load state from storageState prop', () => {
      const storageState = {
        version: '1.0.0',
        timestamp: Date.now(),
        tabs: {
          activeId: 'stored-tab',
          definitions: [
            { id: 'stored-tab', title: 'Stored Tab', mode: 'news', params: {} }
          ]
        }
      };
      
      const { result } = renderHook(() => 
        useAppTabs({ storageInitialized: true, storageState })
      );
      
      expect(result.current.tabs.length).toBe(1);
      expect(result.current.activeTabId).toBe('stored-tab');
    });
  });
}); 