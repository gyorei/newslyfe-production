// TabSearchPanel.tsx - JAVÍTOTT VERZIÓ (Fix lapozó)

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NewsItem } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { Card } from '../Card/Card';
import styles from './TabSearchPanel.module.css';
// ADSENSE TEMPORARILY DISABLED
// import { injectAdsIntoNewsItems, AdCardItem } from '../Ad/AdCard';
// import AdSenseLayout from '../Ad/AdCard/AdSenseLayout';
import { useTabCache } from '../../hooks/useTabStorage/useTabCache';
import Pagination from '../Pagination/Pagination';
import { useTabPagination } from '../../hooks/useTabStorage/useTabPagination';

interface TabSearchPanelProps {
  tabSearchResults: NewsItem[];
  searchTerm?: string;
  onClearSearch?: () => void;
  activeTabId: string;
  tabTitle?: string;
  onPaginationChange?: (shouldScrollToTop?: boolean) => void;
  // ✅ ÚJ: Filter Settings panel megnyitásához
  openRightPanelWithMode?: (mode: string, category?: string) => void;
}

export const TabSearchPanel: React.FC<TabSearchPanelProps> = ({
  tabSearchResults,
  searchTerm,
  onClearSearch,
  activeTabId,
  tabTitle,
  onPaginationChange,
  // ✅ ÚJ: Filter Settings panel megnyitásához
  openRightPanelWithMode,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [maxAgeHours, setMaxAgeHours] = useState(24);
  const [cachedResults, setCachedResults] = useState<NewsItem[] | null>(null);
  
  const { getUserPreference } = useStorage();
  const { saveTabContent, getTabContent } = useTabCache();
  
  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Preferences betöltése
  useEffect(() => {
    const loadPreferences = async () => {
      const itemsPerPagePref = await getUserPreference('user_itemsPerPage');
      if (itemsPerPagePref && Number.isFinite(itemsPerPagePref.value)) {
        setItemsPerPage(Number(itemsPerPagePref.value));
      }
      const maxAgeHoursPref = await getUserPreference('user_maxAgeHours');
      if (maxAgeHoursPref && Number.isFinite(maxAgeHoursPref.value)) {
        setMaxAgeHours(Number(maxAgeHoursPref.value));
      }
    };
    loadPreferences();
  }, [getUserPreference]);

  // Search term kinyerése a fül címéből
  const derivedSearchTerm = useMemo(() => {
    if (searchTerm) return searchTerm;
    if (typeof tabTitle === 'string' && tabTitle.startsWith('🔍')) {
      const match = tabTitle.match(/🔍\s+(.+)/);
      return match ? match[1].trim() : '';
    }
    return '';
  }, [searchTerm, tabTitle]);

  // Cache mentés
  useEffect(() => {
    if (activeTabId && tabSearchResults.length > 0 && derivedSearchTerm) {
      const tabContentData = {
        id: activeTabId,
        articles: tabSearchResults.map(item => ({ ...item })),
        timestamp: Date.now(),
        meta: {
          searchTerm: derivedSearchTerm,
          lastFetched: Date.now(),
        },
      };
      saveTabContent(tabContentData, activeTabId);
    }
  }, [activeTabId, tabSearchResults, derivedSearchTerm, saveTabContent]);

  // Cache visszatöltés
  useEffect(() => {
    if (activeTabId && (!tabSearchResults || tabSearchResults.length === 0) && derivedSearchTerm) {
      (async () => {
        const cached = await getTabContent(activeTabId);
        if (
          cached &&
          cached.meta &&
          cached.meta.searchTerm === derivedSearchTerm &&
          Array.isArray(cached.articles) &&
          cached.articles.length > 0
        ) {
          setCachedResults(
            (cached.articles as Partial<NewsItem>[]).map(a => ({
              id: a.id || '',
              title: a.title || '',
              description: a.description || '',
              source: a.source || '',
              sourceId: a.sourceId || '',
              url: a.url || '',
              date: a.date || '',
              country: a.country || '',
              countryCode: a.countryCode || '',
              imageUrl: a.imageUrl || '',
              timestamp: a.timestamp || Date.now(),
              continent: a.continent || '',
            }))
          );
        }
      })();
    }
  }, [activeTabId, derivedSearchTerm, getTabContent, tabSearchResults]);

  // Eredmények meghatározása
  const displayResults = useMemo(() =>
    tabSearchResults.length > 0 ? tabSearchResults : (cachedResults || [])
  , [tabSearchResults, cachedResults]);

  // Szűrés és oldalszámozás
  const { filteredItems, pageItems, totalPages, calculatedValidPage } = useMemo(() => {
    const filteredByCountry = displayResults;
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const filteredByTime = filteredByCountry.filter((item) => {
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }
      return true;
    });
    const totalItems = filteredByTime.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const calculatedValidPage = Math.min(currentPage, totalPages);
    const startIndex = (calculatedValidPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    return {
      filteredItems: filteredByTime,
      pageItems: filteredByTime.slice(startIndex, endIndex),
      totalPages,
      calculatedValidPage,
    };
  }, [displayResults, maxAgeHours, currentPage, itemsPerPage]);

  // ADSENSE TEMPORARILY DISABLED
  // const itemsWithAds = useMemo(() => injectAdsIntoNewsItems(pageItems, 5, 10), [pageItems]);
  const itemsWithAds = pageItems; // No ads injected

  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);

  // Oldalszám állapot visszaállítása
  useEffect(() => {
    if (!activeTabId) return;
    try {
      const state = loadPaginationState(activeTabId);
      if (state && state.currentPage && Number.isFinite(state.currentPage)) {
        setCurrentPage(state.currentPage);
      }
      if (state && state.itemsPerPage && Number.isFinite(state.itemsPerPage)) {
        setItemsPerPage(state.itemsPerPage);
      }
    } catch (err) {
      // ignore
    }
  }, [activeTabId, loadPaginationState]);

  // Oldalváltás kezelése
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (activeTabId && activeTabId !== 'default') {
      try {
        savePaginationState(newPage, itemsPerPage, activeTabId);
      } catch (err) {
        console.warn('[TabSearchPanel] savePaginationState hiba:', err);
      }
    }

    // Scroll tetejére ha van container
    if (containerRef.current) {
      try {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        // ignore scroll errors
      }
    }

    try {
      onPaginationChange?.(true);
    } catch (err) {
      console.warn('[TabSearchPanel] onPaginationChange hiba:', err);
    }
  }, [activeTabId, itemsPerPage, savePaginationState, onPaginationChange]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelContent}>
        {pageItems.length > 0 ? (
          <>
            <div className={styles.searchModeHeader}>
              <div className={styles.searchResultsInfo}>
                <strong>{filteredItems.length} results</strong>
                {searchTerm && <span> for <em>&quot;{searchTerm}&quot;</em></span>}
              </div>
              <div className={styles.searchModeActions}>
                {/* ✅ ÚJ: Filter Settings gomb */}
                <button 
                  className={styles.filterSettingsButton} 
                  onClick={() => openRightPanelWithMode?.('settings', 'search')}
                  title={t('tabSearchPanel.filterSettings')}
                  aria-label={t('tabSearchPanel.openFilterSettings')}
                >
                  🔧 {t('tabSearchPanel.filter')}
                </button>
                {/* ✅ Meglévő: Clear Search gomb */}
              {onClearSearch && (
                <button className={styles.clearSearchButton} onClick={onClearSearch} title={t('tabSearchPanel.clearSearch')} aria-label={t('tabSearchPanel.clearSearch')}>
                  ✕
                </button>
              )}
              </div>
            </div>
            
            <div className={styles.cardsContainer} ref={containerRef}>
              {itemsWithAds.map((item, index) => {
                // ADSENSE TEMPORARILY DISABLED
                // if ((item as AdCardItem).type === 'ad') {
                //   const ad = item as AdCardItem;
                //   return (
                //     <AdSenseLayout
                //       key={`ad-${ad.id}`}
                //       slotId={ad.slotId || '1234567890'}
                //       badgeLabel={t('tabSearchPanel.ad')}
                //       debug={process.env.NODE_ENV !== 'production'}
                //     />
                //   );
                // } else {
                // Always treat as news item since ads are disabled
                  const news = item as NewsItem;
                  const resolvedImage =
                    news.imageUrl ||
                    ((news as unknown) as { image?: string }).image ||
                    ((news as unknown) as { thumbnail?: string }).thumbnail ||
                    '/assets/images/placeholder.jpg';

                  return (
                    <Card
                      key={news.id || index}
                      {...{ ...news, category: undefined, imageUrl: resolvedImage }}
                      isSearchResult={true}
                      onClick={() => {
                        if (news.url) {
                          window.open(news.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    />
                  );
                }
              })}
            </div>

            {/* ✅ JAVÍTOTT: Mindig látható lapozó (mint a TabPanel-ben) */}
            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <div className={styles.pageInfo}>
                  Total {filteredItems.length} articles | {Math.max(1, (calculatedValidPage - 1) * itemsPerPage + 1)}-{Math.min(calculatedValidPage * itemsPerPage, filteredItems.length)} displayed
                </div>
                <Pagination
                  currentPage={calculatedValidPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  displayRange={1}
                />
              </div>
            )}
          </>
        ) : (
          <div className={styles.placeholderText}>
            No results found for your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};