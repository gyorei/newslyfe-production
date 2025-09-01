import React from 'react';
import styles from './SideAd.module.css';
import { AdCard } from '../AdCard/AdCard';

interface SideAdProps {
  isSearchActive?: boolean;
  searchResults?: string[];
  position: 'below-countries' | 'below-search-results';
  activeLetter?: string; // ABC kereső aktív betűje
}

export const SideAd: React.FC<SideAdProps> = ({
  isSearchActive = false,
  searchResults = [],
  position,
  activeLetter,
}) => {
  const dynamicClass = position === 'below-search-results' ? styles.belowSearchResults : styles.belowCountries;
  
  // Dinamikus ad slot ABC betű alapján
  const adSlot = activeLetter 
    ? `sidebar-compact-${activeLetter.toLowerCase()}` 
    : 'sidebar-compact';

  return (
    <div className={`${styles.sideAdCompact} ${dynamicClass}`}>
      <AdCard 
        title="Sidebar Advertisement"
        description="This is a sidebar ad next to the ABC search"
        advertiser="Advertiser"
        clickUrl="#"
        badgeLabel="Ad"
        onClick={() => {
          console.log(`[SideAd] Ad click: ${position}, letter: ${activeLetter || 'none'}`);
        }}
      />
    </div>
  );
}; 