/*
import React from 'react';

export interface LanguageFilterProps {
  supportedLanguages: { [key: string]: string }; // pl. { all: 'Minden', en: 'Angol', hu: 'Magyar' }
  activeLanguage: string;
  languageBreakdown?: { [key: string]: number };
  onLanguageChange: (lang: string) => void;
}

const LanguageFilter: React.FC<LanguageFilterProps> = ({
  supportedLanguages,
  activeLanguage,
  languageBreakdown = {},
  onLanguageChange,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Object.entries(supportedLanguages).map(([lang, label]) => (
        <button
          key={lang}
          type="button"
          onClick={() => onLanguageChange(lang)}
          style={{
            fontWeight: activeLanguage === lang ? 'bold' : 'normal',
            background: activeLanguage === lang ? '#e0e0e0' : '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: 'pointer',
          }}
        >
          {label} {languageBreakdown[lang] !== undefined ? `(${languageBreakdown[lang]})` : ''}
        </button>
      ))}
    </div>
  );
};

export default LanguageFilter;
*/