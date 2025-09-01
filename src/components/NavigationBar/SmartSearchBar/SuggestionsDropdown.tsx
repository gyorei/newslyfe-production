// src/components/NavigationBar/SmartSearchBar/SuggestionsDropdown.tsx
import React from 'react';
import styles from '../NavigationBar.module.css';
import { useTranslation } from 'react-i18next';

// ✅ TÍPUS EXPORTÁLÁSA:
export interface SuggestionsDropdownProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  query: string;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  suggestions,
  onSelect,
  query,
}) => {
  const { t } = useTranslation();
  // Keresési kifejezés kiemelése a javaslatokban
  const highlightMatch = (suggestion: string, query: string) => {
    if (!query.trim()) return suggestion;

    const lowerQuery = query.toLowerCase();
    const lowerSuggestion = suggestion.toLowerCase();
    const index = lowerSuggestion.indexOf(lowerQuery);

    if (index === -1) return suggestion;

    const before = suggestion.slice(0, index);
    const match = suggestion.slice(index, index + query.length);
    const after = suggestion.slice(index + query.length);

    return (
      <>
        {before}
        <span className={styles.highlightedMatch}>{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className={styles.suggestionsDropdown}>
      <div className={styles.suggestionsHeader} aria-live="polite">💡 {t('search.suggestionsAria', 'Search suggestions')}</div>
      <ul className={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className={styles.suggestionItem}
            onClick={() => onSelect(suggestion)}
            onMouseDown={(e) => e.preventDefault()} // Megakadályozza az input blur-t
          >
            <span className={styles.suggestionIcon} aria-hidden="true">🔍</span>
            <span className={styles.suggestionText}>{highlightMatch(suggestion, query)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
