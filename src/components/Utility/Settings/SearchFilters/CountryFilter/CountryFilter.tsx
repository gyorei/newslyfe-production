// src/components/Utility/Settings/SearchFilters/CountryFilter/CountryFilter.tsx
import React from 'react';
import Select, { GroupBase, StylesConfig } from 'react-select';
import styles from './CountryFilter.module.css';

export interface CountryOption {
  value: string;
  label: string;
}

export interface CountryFilterProps {
  options: string[];
  selectedCountries: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

const customStyles: StylesConfig<CountryOption, true, GroupBase<CountryOption>> = {
  control: (provided) => ({
    ...provided,
    borderColor: '#ccc',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#888',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#333',
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#555',
    ':hover': {
      backgroundColor: '#c0c0c0',
      color: 'white',
    },
  }),
};

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export const CountryFilter: React.FC<CountryFilterProps> = ({
  options,
  selectedCountries,
  onChange,
  isLoading = false,
}) => {
  const selectOptions = options.map(code => ({
    value: code,
    label: `${getFlagEmoji(code)} ${code}`
  }));

  const selectedValues = selectOptions.filter(option =>
    selectedCountries.includes(option.value)
  );

  return (
    <div className={styles.filterWrapper}>
      <Select<CountryOption, true, GroupBase<CountryOption>>
        isMulti
        options={selectOptions}
        value={selectedValues}
        onChange={(selectedOptions) => {
          const newSelectedCountries = selectedOptions.map(option => option.value);
          onChange(newSelectedCountries);
        }}
        isLoading={isLoading}
        placeholder={isLoading ? "Országok betöltése..." : "Válassz egy vagy több országot..."}
        styles={customStyles}
        closeMenuOnSelect={false}
        isDisabled={isLoading}
        noOptionsMessage={() => isLoading ? "Betöltés..." : "Nincs elérhető ország"}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
      />
    </div>
  );
};