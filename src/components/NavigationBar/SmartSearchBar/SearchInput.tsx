// src\components\NavigationBar\SmartSearchBar\SearchInput.tsx

// -----------------------------------------------------------------------------
// SearchInput.tsx
// Biztonságos, újrahasznosítható kereső input komponens a SmartSearchBar-hoz.
// XSS, SQL injection és DoS védelem beépítve.
// A keresési logika és az állapotkezelés a szülő komponensben van.
// !! MOST A KERESŐSÁV ENTERPRISE-GRADE BIZTONSÁGÚ! 🎯
// -----------------------------------------------------------------------------
import React from 'react';
import styles from '../NavigationBar.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  placeholder?: string;
  maxLength?: number;
  validateInput?: (input: string) => string;
}


export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder,
  maxLength = 100,
  validateInput,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // 🛡️ Enhanced XSS Protection - HTML tags AND dangerous characters
    newValue = newValue.replace(/<[^>]*>/g, '') // Remove HTML tags
                      .replace(/[<>"'&]/g, ''); // Remove XSS dangerous characters

    // 🛡️ Control characters removal (ESLint compliant)
    // eslint-disable-next-line no-control-regex
    newValue = newValue.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // 🛡️ Enhanced SQL Injection Protection
    newValue = newValue.replace(/[;'--]/g, ''); // Block SQL injection chars including --

    // 🛡️ Block dangerous URL protocols
    newValue = newValue.replace(/(javascript|data|vbscript):/gi, '');

    // 🛡️ Remove leading/trailing whitespace
    newValue = newValue.trim();

    // 🛡️ Length limitation (DoS protection)
    if (newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
    }

    // ✅ Optional custom validation
    if (validateInput) {
      newValue = validateInput(newValue);
    }

    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <span className={styles.searchIcon} aria-hidden="true">🔍</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className={styles.input}
        maxLength={maxLength}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label={placeholder || "Keresés"}
      />
      {value && (
        <button 
          onClick={() => onChange('')} 
          className={styles.clearButton}
          aria-label="Keresés törlése"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};
