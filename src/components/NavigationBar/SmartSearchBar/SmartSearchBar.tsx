// src\components\NavigationBar\SmartSearchBar\SmartSearchBar.tsx
// keresés kizárólag backend-alapú.

/*
a frontend-only keresési kódok (pl. useFrontendSearch, 
kapcsolódó logika) bent maradnak, amíg a const
 FRONTEND_SEARCH_ENABLED = false; be van állítva.
A rendszer így kizárólag a backend keresést használja,
 a frontend logika nem fut le, csak "halott kód" marad.

Előnyök, ha bent hagyod:

Gyorsan visszakapcsolható, ha később szükség lenne rá
 (pl. offline mód, fejlesztői tesztelés).
Nem kell újraírni, ha újra kellene a funkció.
Hátrányok:

A kód egy része feleslegesen bent marad,
 kicsit átláthatatlanabb lehet hosszú távon.
A projekt mérete nő, minimálisan lassabb lehet a build/lint.
*/

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../NavigationBar.module.css';
import { NewsItem } from '../../../types';
import { useSearch } from '../../Side/Search/useSearch'; // ✅ useSearch hook import
import { useFrontendSearch } from './hooks/useFrontendSearch'; // Frontend
import { useTranslation } from 'react-i18next';

// ✅ FRONTEND SEARCH RESULT TÍPUS IMPORT/DEFINÍCIÓ
// Média típus a robust képfeloldáshoz
interface MediaItem {
  url?: string;
  thumbnail?: string;
}

// Frissítjük a FrontendSearchResult típust, ahol az id lehet number vagy string
interface FrontendSearchResult {
  id: number | string;
  title: string;
  url: string;
  content: string;
  created_at: string;
  language: string;
  source?: string;
  country?: string;
  relevance_score: number;
  // Alternatív képfeloldások
  imageUrl?: string;
  image_url?: string;
  image?: string;
  thumbnail?: string;
  og_image?: string;
  media?: MediaItem[];
}

// Backend search result típus (használjuk a (item as ...) helyett)
interface BackendSearchResult {
  id: number | string;
  title: string;
  url?: string;
  description?: string;
  created_at?: string;
  language?: string;
  source?: string;
  country?: string;
  // képfeloldási alternatívák
  imageUrl?: string;
  image_url?: string;
  image?: string;
  thumbnail?: string;
  og_image?: string;
  media?: MediaItem[];
}

// ✅ TÍPUS JAVÍTÁSA - NavigationBar kompatibilis:
export interface SmartSearchBarProps {
  activeTabId: string; // ÚJ: az aktív tab azonosítója
  placeholder?: string;
  onSearch: (query: string, results: NewsItem[]) => void; // ✅ JAVÍTVA
  onClear?: () => void; // ✅ ÚJ prop
  newsItems?: NewsItem[]; // ✅ ÚJ prop a kereséshez
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Vivaldi-stílusú SmartSearchBar komponens
 *
 * Intelligens keresőmező javaslatok támogatással:
 * - Keresési előzmények
 * - Automatikus javaslatok
 * - Könyvjelző alapú keresés
 * - Szűrési lehetőségek (forrás:, kategória: stb.)
 */
export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  placeholder = 'Search news or filter by source...',
  onSearch,
  onClear,
  newsItems = [],
  value = '',
  onChange = () => {},
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t('search.placeholder', 'Search news or filter by source...');
  // ✅ ÚJ: FRONTEND/BACKEND KAPCSOLÓ

  // Frontend keresés (jelenlegi beállítás):
  // const FRONTEND_SEARCH_ENABLED = true; // ← Memória keresés

  // Backend keresés váltás:
  // const FRONTEND_SEARCH_ENABLED = false; // ← API keresés

  const FRONTEND_SEARCH_ENABLED = true; // ← Itt lehet váltani!

  // ✅ JAVÍTOTT: useSearch hook helyes destructuring
  const { results: searchResults, performSearch, loading, error: _error } = useSearch();

  const { performSearch: performFrontendSearch } = useFrontendSearch();

  // Belső állapotok
  const [query, setQuery] = useState<string>(value);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  // ✅ ÚJ: VÉGTELEN LOOP GUARD
  const [hasSearchTriggered, setHasSearchTriggered] = useState<boolean>(false);

  // Referenciák
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 🛡️ Constants for duplicate strings
  const UNKNOWN_SOURCE_KEY = 'search.unknownSource';
  const UNKNOWN_SOURCE_FALLBACK = 'Unknown source';
  
  // 🛡️ URL validáció erősítése a keresési eredmények konverziójánál
  const safeUrl = (url: string | undefined): string => {
    if (!url) return '';
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol) ? url : '';
    } catch {
      return '';
    }
  };
  
  // 🛡️ Secure helper: forrásnév kinyerése sanitized URL fallback-el
  const getSourceName = useCallback((item: { source?: string; url?: string }): string => {
    // 🛡️ Sanitize source name
    if (item.source && item.source.trim()) {
      const sanitizedSource = item.source
        .replace(/[<>"'&]/g, '') // Remove XSS characters
        .replace(/[;'--]/g, '') // Remove SQL injection chars
        .trim();
      if (sanitizedSource) return sanitizedSource;
    }
    
    if (item.url) {
      try {
        // 🛡️ Sanitize URL before parsing
        const sanitizedUrl = item.url
          .replace(/[<>"'&]/g, '') // Remove XSS characters
          .replace(/javascript:/gi, '') // Block javascript URLs
          .replace(/data:/gi, '') // Block data URLs
          .replace(/vbscript:/gi, '') // Block vbscript URLs
          .trim();
        
        // ✅ Flexible URL validation - supports relative URLs too
        if (!sanitizedUrl || (!sanitizedUrl.match(/^https?:\/\//) && !sanitizedUrl.startsWith('/'))) {
          return t(UNKNOWN_SOURCE_KEY, UNKNOWN_SOURCE_FALLBACK);
        }
        
        // ✅ Handle relative URLs with base URL
        const hostname = new URL(sanitizedUrl, 'https://example.com').hostname
          .replace(/[<>"'&]/g, '') // Additional sanitization
          .replace(/^www\./, ''); // Only remove www prefix
          
        return hostname || t(UNKNOWN_SOURCE_KEY, UNKNOWN_SOURCE_FALLBACK);
      } catch {
        // URL parsing failed - return safe fallback
        return t(UNKNOWN_SOURCE_KEY, UNKNOWN_SOURCE_FALLBACK);
      }
    }
    return t(UNKNOWN_SOURCE_KEY, UNKNOWN_SOURCE_FALLBACK);
  }, [t]);

  // ✅ JAVÍTOTT: searchResults változás figyelése - TÍPUSOS ÉS TISZTA
  useEffect(() => {
    console.log(
      '[DEBUG] searchResults changed:',
      searchResults.length,
      'lastQuery:',
      lastSearchQuery,
      'hasTriggered:',
      hasSearchTriggered,
    );

    if (
      searchResults.length > 0 &&
      lastSearchQuery &&
      !hasSearchTriggered &&
      !FRONTEND_SEARCH_ENABLED
    ) {
      console.log('[DEBUG] Converting and calling onSearch...');
      console.log('[SmartSearchBar] Search results updated:', searchResults.length);

      // SearchResult[] → NewsItem[] konverzió - INTELLIGENS FORRÁS KEZELÉSSEL
      const convertedResults: NewsItem[] = searchResults.map((item) => {
        const it = item as BackendSearchResult;
        const dateStr = it.created_at || new Date().toISOString();
        return {
          id: String(it.id),
          title: it.title,
          description: it.description || '',
          url: safeUrl(it.url) || '',
          source: getSourceName(it),
          sourceId: it.source || 'unknown',
          category: 'news',
          publishedAt: dateStr,
          date: dateStr,
          timestamp: it.created_at ? new Date(it.created_at).getTime() : Date.now(),
          language: it.language || 'hu',
          country: it.country || 'HU',
          continent: 'Europe',
          imageUrl: it.imageUrl || it.image_url || it.image || undefined,
        };
      });

      console.log('[DEBUG] Calling onSearch with:', convertedResults.length, 'results');
      onSearch(lastSearchQuery, convertedResults);
      console.log('[DEBUG] onSearch called successfully');

      // ✅ GUARD: csak egyszer fut le ugyanazon keresési eredményre
      setHasSearchTriggered(true);
    }
  }, [searchResults, lastSearchQuery, onSearch, hasSearchTriggered, FRONTEND_SEARCH_ENABLED, getSourceName]);

  // ✅ ÚJ: Guard reset új kereséskor
  useEffect(() => {
    setHasSearchTriggered(false);
    console.log('[DEBUG] Search guard reset for new query:', lastSearchQuery);
  }, [lastSearchQuery]);

  // ✅ ÚJ: Generált javaslatok newsItems alapján
  const suggestions = React.useMemo(() => {
    if (query.length < 2 || newsItems.length === 0) return [];

    const queryLower = query.toLowerCase();
    const uniqueSuggestions = new Set<string>();

    // Címek alapján
    newsItems.forEach((item) => {
      if (item.title.toLowerCase().includes(queryLower)) {
        uniqueSuggestions.add(item.title);
      }
    });

    // Források alapján
    newsItems.forEach((item) => {
      if (item.source && item.source.toLowerCase().includes(queryLower)) {
        uniqueSuggestions.add(`forrás:${item.source}`);
      }
    });

    return Array.from(uniqueSuggestions)
      .slice(0, 8) // Maximum 8 javaslat
      .map((text) => ({
        text,
        type: text.startsWith('forrás:') ? 'bookmark' : ('suggestion' as const),
      }));
  }, [query, newsItems]);

  // Szinkronizálás a prop value-val
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 🛡️ Enhanced secure input változás kezelése
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // 🛡️ Enhanced XSS Protection - comprehensive HTML removal
    newValue = newValue
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Explicit script removal
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/[<>"'&]/g, '') // Remove XSS dangerous characters
      .replace(/(javascript|data|vbscript):/gi, '') // Block dangerous URLs
      .replace(/[;'--]/g, '') // Remove SQL injection characters
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim(); // Remove leading/trailing whitespace

    // 🛡️ Length limitation (DoS protection)
    if (newValue.length > 100) {
      newValue = newValue.substring(0, 100);
    }

    setQuery(newValue);
    onChange(newValue);

    // Javaslatok megjelenítése, ha van szöveg
    setShowSuggestions(newValue.length >= 2 && suggestions.length > 0);
    setSelectedSuggestion(-1); // Reset selection
  };

  // Enter lenyomás kezelése
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[SmartSearchBar] Key pressed:', e.key);

    if (e.key === 'Enter') {
      console.log('[SmartSearchBar] Enter detected!');
      e.preventDefault();
      handleSubmitSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
      inputRef.current?.blur();
    }
  };

  // ✅ ÚJ: HIBRID KERESÉS VÉGREHAJTÁSA
  const handleSubmitSearch = async () => {
    console.log('[SmartSearchBar] handleSubmitSearch started, query:', query);

    let searchQuery = query;

    // Ha van kiválasztott javaslat, azt használjuk
    if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
      searchQuery = suggestions[selectedSuggestion].text;
      setQuery(searchQuery);
      onChange(searchQuery);
    }

    try {
      setLastSearchQuery(searchQuery);

      // 🎯 ÚJ: HIBRID KERESÉSI LOGIKA
      if (FRONTEND_SEARCH_ENABLED) {
        console.log('[SmartSearchBar] Using FRONTEND search');
        const results = performFrontendSearch(searchQuery, newsItems);

        // Azonos konverzió, mint a backend esetében
        const convertedResults: NewsItem[] = (results as FrontendSearchResult[]).map((item) => {
          const it = item as FrontendSearchResult;
          const firstMedia = Array.isArray(it.media) && it.media.length > 0 ? (it.media[0] as MediaItem) : undefined;
          const mediaImg = firstMedia?.url || firstMedia?.thumbnail;
          const img = it.imageUrl || it.image_url || it.image || it.thumbnail || it.og_image || mediaImg || undefined;
          const dateStr = it.created_at || new Date().toISOString();

          return {
            id: String(it.id),
            title: it.title,
            description: it.content?.substring(0, 200) + '...',
            url: safeUrl(it.url) || '',
            source: getSourceName({ source: it.source, url: it.url }),
            sourceId: it.source || 'unknown',
            category: 'news',
            publishedAt: dateStr,
            date: dateStr,
            timestamp: it.created_at ? new Date(it.created_at).getTime() : Date.now(),
            language: it.language || 'hu',
            country: it.country || 'HU',
            continent: 'Europe',
            imageUrl: img,
          };
        });

        onSearch(searchQuery, convertedResults);
        console.log(
          '[SmartSearchBar] Frontend search completed:',
          convertedResults.length,
          'results',
        );
      } else {
        console.log('[SmartSearchBar] Using BACKEND search');
        await performSearch(searchQuery);
        // A meglévő useEffect fogja kezelni az eredményeket
      }
    } catch (error) {
      console.error('[SmartSearchBar] Search error:', error);

      // ✅ FALLBACK - HELYI KERESÉS HIBA ESETÉN:
      const localResults = newsItems.filter((item) => {
        const queryLower = searchQuery.toLowerCase();

        // Forrás szűrés (forrás:xyz formátum)
        if (searchQuery.startsWith('forrás:')) {
          const sourceQuery = searchQuery.substring(7).toLowerCase();
          return item.source?.toLowerCase().includes(sourceQuery);
        }

        // Általános keresés
        return (
          item.title.toLowerCase().includes(queryLower) ||
          item.description?.toLowerCase().includes(queryLower) ||
          item.source?.toLowerCase().includes(queryLower)
        );
      });

      onSearch(searchQuery, localResults);
      console.log('[SmartSearchBar] Fallback search completed:', localResults.length, 'results');
    }

    setShowSuggestions(false);
    setSelectedSuggestion(-1);

    console.log('[SmartSearchBar] handleSubmitSearch completed');
  };

  // Javaslat kiválasztása
  const handleSuggestionClick = (suggestion: { text: string; type: string }) => {
    setQuery(suggestion.text);
    onChange(suggestion.text);

    // Keresés végrehajtása a kiválasztott javaslattal
    const queryLower = suggestion.text.toLowerCase();
    const searchResults: NewsItem[] = newsItems.filter((item) => {
      if (suggestion.text.startsWith('forrás:')) {
        const sourceQuery = suggestion.text.substring(7).toLowerCase();
        return item.source?.toLowerCase().includes(sourceQuery);
      }
      return (
        item.title.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.source?.toLowerCase().includes(queryLower)
      );
    });

    onSearch(suggestion.text, searchResults);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    inputRef.current?.focus();
  };

  // Fókusz események
  const handleFocus = () => {
    setFocused(true);
    if (query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Kis késleltetés, hogy a javaslat kattintás működjön
    setTimeout(() => {
      setFocused(false);
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }, 200);
  };

  // Keresési ikon gomb
  const handleSearchIconClick = () => {
    if (query.trim()) {
      handleSubmitSearch();
    } else {
      inputRef.current?.focus();
    }
  };

  // ✅ ÚJ: Törlés funkció
  const handleClear = () => {
    setQuery('');
    onChange('');
    setShowSuggestions(false);
    setLastSearchQuery('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`${styles.searchContainer} ${focused ? styles.focused : ''}`}>
      {/* Keresési ikon */}
      <button
        className={styles.searchIcon}
        onClick={handleSearchIconClick}
        disabled={loading}
        title={loading ? t('search.searching', 'Searching...') : t('search.startSearch', 'Start search')}
        aria-label={loading ? t('search.searching', 'Searching...') : t('search.startSearch', 'Start search')}
      >
        {loading ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.spinning}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="32"
              strokeDashoffset="32"
            >
              <animate
                attributeName="strokeDashoffset"
                values="32;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        )}
      </button>

      {/* Keresőmező */}
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={resolvedPlaceholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={loading}
        aria-label={t('search.inputAria', 'Search field')}
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        role="combobox"
      />

      {/* Törlés gomb */}
      {query.length > 0 && (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          title={t('search.clear', 'Clear search field')}
          aria-label={t('search.clear', 'Clear search field')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}

      {/* Javaslatok dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={styles.suggestionsDropdown}
          role="listbox"
          aria-label={t('search.suggestionsAria', 'Search suggestions')}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`${styles.suggestionItem} ${styles[suggestion.type]} ${
                index === selectedSuggestion ? styles.selected : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={index === selectedSuggestion}
            >
              <span className={styles.suggestionIcon} aria-hidden="true">
                {suggestion.type === 'history' && '🕒'}
                {suggestion.type === 'suggestion' && '🔍'}
                {suggestion.type === 'bookmark' && '⭐'}
              </span>
              <span className={styles.suggestionText}>{suggestion.text}</span>
              {suggestion.type === 'history' && (
                <span className={styles.suggestionType}>{t('search.suggestion.history', 'History')}</span>
              )}
              {suggestion.type === 'bookmark' && (
                <span className={styles.suggestionType}>{t('search.suggestion.bookmark', 'Source')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
