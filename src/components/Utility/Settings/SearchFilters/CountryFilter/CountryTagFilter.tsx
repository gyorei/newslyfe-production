// src\components\Utility\Settings\SearchFilters\CountryFilter\CountryTagFilter.tsx
import React from 'react';
import styles from './CountryTagFilter.module.css';

export interface CountryTagOption {
  code: string;
  name: string;
  count: number;
}

interface CountryTagFilterProps {
  options: CountryTagOption[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

export const CountryTagFilter: React.FC<CountryTagFilterProps> = ({ options, selectedOptions, onChange, isLoading = false }) => {
  const handleToggle = (code: string) => {
    const isSelected = selectedOptions.includes(code);
    let newSelected: string[];
    if (isSelected) {
      newSelected = selectedOptions.filter(c => c !== code);
    } else {
      newSelected = [...selectedOptions, code];
    }
    onChange(newSelected);
  };

  if (isLoading) {
    return <div className={styles.tagContainer}></div>;
  }

  return (
    <div className={styles.tagContainer}>
      {options.map(option => {
        const isSelected = selectedOptions.includes(option.code);
        return (
          <div
            key={option.code}
            className={styles.row + (isSelected ? ' ' + styles.selected : '')}
            onClick={() => handleToggle(option.code)}
            role="button"
            tabIndex={0}
            onKeyPress={e => {
              if (e.key === 'Enter' || e.key === ' ') handleToggle(option.code);
            }}
          >
            <div className={styles.checkbox} aria-checked={isSelected}>
              {isSelected ? (
                <span className={styles.checkmark}>✔</span>
              ) : (
                <span className={styles.xmark}>×</span>
              )}
            </div>
            <div className={styles.label}>
              {option.name} <span className={styles.count}>({option.count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
