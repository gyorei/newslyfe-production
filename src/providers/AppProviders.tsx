import React from 'react';
import { CategoryProvider } from '../components/CategoryBar';
import { LanguageProvider } from '../contexts/LanguageContext';
import { IntroProvider } from '../components/IntroProvider/IntroProvider'; // <-- EZ KELL
/**
 * Alkalmazás Provider komponens
 *
 * Az összes kontextus-szolgáltató komponenst egységesen kezeli,
 * így az App.tsx-ben csak egyetlen wrapperre van szükség
 */

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <CategoryProvider>
        <IntroProvider>
          {children}
        </IntroProvider>
      </CategoryProvider>
    </LanguageProvider>
  );
};

export default AppProviders;
