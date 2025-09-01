import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TabController from './TabController';
import { NewsItem } from '../../types';

// Mock a komponenseket
vi.mock('./Home/Home', () => ({
  default: vi.fn(({ title, onConfigChange, onSearchComplete }) => (
    <div data-testid="home-component">
      <h2>{title || 'Home'}</h2>
      <button onClick={() => onConfigChange('news')}>News Mode</button>
      <button onClick={() => onConfigChange('search')}>Search Mode</button>
      <button onClick={() => onConfigChange('video')}>Video Mode</button>
      <button onClick={() => onSearchComplete([], 'test query')}>Search</button>
    </div>
  )),
}));

vi.mock('./SearchTab/SearchTab', () => ({
  default: vi.fn(({ searchTerm }) => (
    <div data-testid="search-tab-component">
      <h2>Search: {searchTerm}</h2>
    </div>
  )),
}));

vi.mock('../Panel/Panel', () => ({
  Panel: vi.fn(({ activeTabId, title, newsItems, loading, error, onRetry, onToggleMenu, searchResults, searchTerm, isSearchMode, onClearSearch }) => (
    <div data-testid="panel-component">
      <h2>{title}</h2>
      <div>Active Tab: {activeTabId}</div>
      <div>News Items: {newsItems.length}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Error: {error ? 'Yes' : 'No'}</div>
      <div>Search Results: {searchResults?.length || 0}</div>
      <div>Search Term: {searchTerm}</div>
      <div>Search Mode: {isSearchMode ? 'Yes' : 'No'}</div>
      <button onClick={onRetry}>Retry</button>
      <button onClick={() => onToggleMenu('test-id', null)}>Toggle Menu</button>
      {onClearSearch && <button onClick={onClearSearch}>Clear Search</button>}
    </div>
  )),
}));

vi.mock('../VideoPanel/VideoPanel', () => ({
  VideoPanel: vi.fn(({ activeTabId, title, videoItems, loading, error, onRetry, onToggleMenu }) => (
    <div data-testid="video-panel-component">
      <h2>{title}</h2>
      <div>Active Tab: {activeTabId}</div>
      <div>Video Items: {videoItems.length}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Error: {error ? 'Yes' : 'No'}</div>
      <button onClick={onRetry}>Retry</button>
      <button onClick={() => onToggleMenu('test-id', null)}>Toggle Menu</button>
    </div>
  )),
}));

// Mock a debug tools
vi.mock('../../utils/debugTools/debugTools', () => ({
  useDebugRender: vi.fn(),
}));

// Mock adatok
const mockNewsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Test News 1',
    description: 'Test description 1',
    url: 'https://example.com/1',
    source: 'Test Source',
    sourceId: 'test-source-1',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: 'https://example.com/image1.jpg',
    country: 'Hungary',
    continent: 'Europe',
    category: 'Technology',
  },
  {
    id: '2',
    title: 'Test News 2',
    description: 'Test description 2',
    url: 'https://example.com/2',
    source: 'Test Source',
    sourceId: 'test-source-2',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: 'https://example.com/image2.jpg',
    country: 'Hungary',
    continent: 'Europe',
    category: 'Technology',
  },
];

const mockSearchResults: NewsItem[] = [
  {
    id: '3',
    title: 'Search Result 1',
    description: 'Search description 1',
    url: 'https://example.com/3',
    source: 'Test Source',
    sourceId: 'test-source-3',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: 'https://example.com/image3.jpg',
    country: 'Hungary',
    continent: 'Europe',
    category: 'Technology',
  },
];

const mockVideoItems: NewsItem[] = [
  {
    id: '4',
    title: 'Video News 1',
    description: 'Video description 1',
    url: 'https://example.com/4',
    source: 'Test Source',
    sourceId: 'test-source-4',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: 'https://example.com/image4.jpg',
    country: 'Hungary',
    continent: 'Europe',
    category: 'Technology',
  },
];

describe('TabController', () => {
  const defaultProps = {
    activeTabId: 'tab-1',
    isNewTab: false,
    tabMode: 'news' as const,
    title: 'Test Tab',
    searchTerm: '',
    newsItems: mockNewsItems,
    loading: false,
    error: null,
    onDismiss: vi.fn(),
    onConfigChange: vi.fn(),
    onRetry: vi.fn(),
    onToggleMenu: vi.fn(),
    searchResults: [],
    isSearchMode: false,
    onClearSearch: vi.fn(),
    videoItems: [],
    videoLoading: false,
    videoError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendereli a Panel komponenst normál tab módban', () => {
    render(<TabController {...defaultProps} />);
    
    expect(screen.getByTestId('panel-component')).toBeInTheDocument();
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
    expect(screen.getByText('Active Tab: tab-1')).toBeInTheDocument();
    expect(screen.getByText('News Items: 2')).toBeInTheDocument();
  });

  it('rendereli a Home komponenst új tab módban', () => {
    render(<TabController {...defaultProps} isNewTab={true} />);
    
    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
  });

  it('rendereli a SearchTab komponenst keresési módban', () => {
    render(<TabController {...defaultProps} tabMode="search" searchTerm="test search" />);
    
    expect(screen.getByTestId('search-tab-component')).toBeInTheDocument();
    expect(screen.getByText('Search: test search')).toBeInTheDocument();
  });

  it('rendereli a VideoPanel komponenst videó módban', () => {
    render(<TabController {...defaultProps} tabMode="video" videoItems={mockVideoItems} />);
    
    expect(screen.getByTestId('video-panel-component')).toBeInTheDocument();
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
    expect(screen.getByText('Video Items: 1')).toBeInTheDocument();
  });

  it('kezeli a loading állapotot', () => {
    render(<TabController {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading: Yes')).toBeInTheDocument();
  });

  it('kezeli a hiba állapotot', () => {
    render(<TabController {...defaultProps} error="Test error" />);
    
    expect(screen.getByText('Error: Yes')).toBeInTheDocument();
  });

  it('kezeli a retry eseményt', () => {
    render(<TabController {...defaultProps} />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(defaultProps.onRetry).toHaveBeenCalled();
  });

  it('kezeli a menu toggle eseményt', () => {
    render(<TabController {...defaultProps} />);
    
    const menuButton = screen.getByText('Toggle Menu');
    fireEvent.click(menuButton);
    
    expect(defaultProps.onToggleMenu).toHaveBeenCalledWith('test-id', null);
  });

  it('kezeli a keresési eredményeket', () => {
    render(<TabController {...defaultProps} searchResults={mockSearchResults} isSearchMode={true} searchTerm="test" />);
    
    expect(screen.getByText('Search Results: 1')).toBeInTheDocument();
    expect(screen.getByText('Search Term: test')).toBeInTheDocument();
    expect(screen.getByText('Search Mode: Yes')).toBeInTheDocument();
  });

  it('kezeli a keresés törlését', () => {
    render(<TabController {...defaultProps} onClearSearch={defaultProps.onClearSearch} />);
    
    const clearButton = screen.getByText('Clear Search');
    fireEvent.click(clearButton);
    
    expect(defaultProps.onClearSearch).toHaveBeenCalled();
  });

  it('kezeli a Home komponens config változásait', () => {
    render(<TabController {...defaultProps} isNewTab={true} />);
    
    const newsButton = screen.getByText('News Mode');
    fireEvent.click(newsButton);
    
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith('news');
  });

  it('kezeli a Home komponens keresési eseményeit', () => {
    render(<TabController {...defaultProps} isNewTab={true} />);
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    // A Home komponens onSearchComplete callback-je meghívódik
    // Ez a TabController-ben a singleTabModes állapotot módosítja
  });

  it('kezeli a videó loading állapotot', () => {
    render(<TabController {...defaultProps} tabMode="video" videoLoading={true} />);
    
    expect(screen.getByText('Loading: Yes')).toBeInTheDocument();
  });

  it('kezeli a videó hiba állapotot', () => {
    render(<TabController {...defaultProps} tabMode="video" videoError="Video error" />);
    
    expect(screen.getByText('Error: Yes')).toBeInTheDocument();
  });

  it('megfelelően kezeli a különböző tab mode-okat', () => {
    // News mode
    const { rerender } = render(<TabController {...defaultProps} tabMode="news" />);
    expect(screen.getByTestId('panel-component')).toBeInTheDocument();
    
    // Search mode
    rerender(<TabController {...defaultProps} tabMode="search" searchTerm="test" />);
    expect(screen.getByTestId('search-tab-component')).toBeInTheDocument();
    
    // Video mode
    rerender(<TabController {...defaultProps} tabMode="video" />);
    expect(screen.getByTestId('video-panel-component')).toBeInTheDocument();
  });

  it('kezeli a single tab mode-ot', () => {
    render(<TabController {...defaultProps} />);
    
    // Először a Home komponenst rendereli, majd a keresés után a Panel-t
    // Ez a logika a TabController-ben van implementálva
    expect(screen.getByTestId('panel-component')).toBeInTheDocument();
  });

  it('megfelelően kezeli az üres news items listát', () => {
    render(<TabController {...defaultProps} newsItems={[]} />);
    
    expect(screen.getByText('News Items: 0')).toBeInTheDocument();
  });

  it('megfelelően kezeli az üres video items listát', () => {
    render(<TabController {...defaultProps} tabMode="video" videoItems={[]} />);
    
    expect(screen.getByText('Video Items: 0')).toBeInTheDocument();
  });
}); 