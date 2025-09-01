// src\components\NavigationBar\SmartSearchBar\SearchInput.tsx

// -----------------------------------------------------------------------------
// SearchInput.tsx
// Egyszerű, újrahasznosítható kereső input komponens a SmartSearchBar-hoz.
// Csak a megjelenítést és az alap eseményeket kezeli (érték, változás, enter, fókusz, törlés).
// A keresési logika és az állapotkezelés a szülő komponensben van.
// -----------------------------------------------------------------------------
import React from 'react';
import styles from '../NavigationBar.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <span className={styles.searchIcon}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className={styles.input}
      />
      {value && (
        <button onClick={() => onChange('')} className={styles.clearButton}>
          ✕
        </button>
      )}
    </div>
  );
};
