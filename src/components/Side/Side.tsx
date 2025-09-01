// src\components\Side\Side.tsx
import * as React from 'react';
import { useState } from 'react';
// import { Continent } from './Continent/Continent';
import { Search } from './Search/Search';
import SideHeader from './SideHeader/SideHeader';
import { NewNewsSection } from './NewNewsSection';
import styles from './Side.module.css';
import { Country } from './Country/Country';
import { ContentTypeToggles } from './FilterToggles/ContentTypeToggles/ContentTypeToggles';
// import { SideAdSticky } from '../Ad/SideAd';
// import { SearchModeToggles } from './FilterToggles/SearchModeToggles/SearchModeToggles';
// import { SideAd } from '../Ad/SideAd';

interface SideProps {
  onFiltersChange: (
    filters: {
      continent?: string;
      country?: string;
      category?: string;
      forceRefresh?: boolean;
    },
    contentType?: 'text' | 'video' | 'both'
  ) => void;
  onUtilityModeChange?: (mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history') => void;
  openRightPanelWithMode?: (mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history') => void;
  onSearchTabOpen?: (searchTerm: string) => void;
  onVideoTabOpen?: () => void;
  onActivateTab?: (tabId: string) => void;
  loadLocalContent?: () => Promise<string | null>;
  isLocationLoading?: boolean;
  // ÚJ: Új hírek kezelése
  showNewNewsSection?: boolean;
  activeNewNewsTab?: string | null;
  onCloseNewNews?: () => void;
  // --- ÚJ: Mobil panel zárás callback és mobil nézet ---
  onCollapseSidePanel?: () => void;
  isMobileView?: boolean;
  // ÚJ: Tartalom típus és keresési mód kezelése
  onContentTypeChange?: (contentType: 'text' | 'video' | 'both') => void;
  onSearchModeChange?: (searchMode: 'countries' | 'source' | 'channel') => void;
  activeContentType?: 'text' | 'video' | 'both';
  activeSearchMode?: 'countries' | 'source' | 'channel';
}

export const Side: React.FC<SideProps> = ({
  onFiltersChange,
  onUtilityModeChange = () => {},
  openRightPanelWithMode = () => {},
  onSearchTabOpen,
  onVideoTabOpen = () => {},
  onActivateTab = () => {},
  loadLocalContent,
  isLocationLoading = false,
  // ÚJ: Új hírek props
  showNewNewsSection = false,
  activeNewNewsTab = null,
  onCloseNewNews = () => {},
  // --- ÚJ: Mobil panel zárás callback és mobil nézet ---
  onCollapseSidePanel,
  isMobileView = false,
  // ÚJ: Tartalom típus és keresési mód props
  onContentTypeChange = () => {},
  onSearchModeChange = () => {},
  activeContentType = 'both',
  activeSearchMode = 'countries',
}) => {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // ÚJ: SideAd állapotkezelés
  const [isCountrySearchActive, setIsCountrySearchActive] = useState(false);
  const [countrySearchResults, setCountrySearchResults] = useState<string[]>([]);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // ÚJ: Side panel navigációs állapot
  const [activeView, setActiveView] = useState<'filter' | 'newNews'>('filter');

  // ÚJ: contentType állapot kezelése
  const [contentType, setContentType] = useState<'text' | 'video' | 'both'>(activeContentType);

  const handleContinentSelect = (continent: string | null) => {
    setSelectedContinent(continent);

    if (continent !== null && selectedCountry !== null) {
      setSelectedCountry(null);
    }

    // CACHE BYPASS: Ország/kontinens váltáskor mindig API hívást kényszerítünk,
    // hogy a felhasználó friss adatokat kapjon, és ne ragadjon be a cache.
    onFiltersChange({
      continent: continent !== null ? continent : undefined,
      category: undefined, // biztosan nem lesz null
      country: continent ? (selectedCountry !== null ? selectedCountry : undefined) : undefined,
      forceRefresh: true,
    }, contentType);
  };

  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);

    if (country !== null && selectedContinent !== null) {
      setSelectedContinent(null); // state: string | null
    }

    // Segédváltozók a filter property-khez, hogy biztosan ne legyen null
    const continentValue: string | undefined = country ? undefined : (selectedContinent !== null ? selectedContinent : undefined);
    const countryValue: string | undefined = country !== null ? country : undefined;

    // CACHE BYPASS: Ország/kontinens váltáskor mindig API hívást kényszerítünk,
    // hogy a felhasználó friss adatokat kapjon, és ne ragadjon be a cache.
    onFiltersChange({
      continent: continentValue,
      category: undefined,
      country: countryValue,
      forceRefresh: true,
    }, contentType);
    if (isMobileView && onCollapseSidePanel) {
      onCollapseSidePanel();
    }
  };

  // ÚJ: Nézet váltás kezelése
  const handleViewChange = (view: 'filter' | 'newNews') => {
    setActiveView(view);
  };

  // ÚJ: Új hírek bezárása
  const handleCloseNewNews = () => {
    setActiveView('filter'); // Vissza a filter nézetre
    onCloseNewNews();
  };

  // Mock új hírek adatok (később valós adatokat fog kapni)
  const mockNewsList = activeNewNewsTab
    ? [
        { id: '1', title: 'Kormány döntés friss híre érkezett', source: 'MTI' },
        { id: '2', title: 'EU szabályozás új fejlemények', source: 'Index' },
        { id: '3', title: 'Sport eredmény ma este', source: 'NSO' },
      ]
    : [];

  // ÚJ: showNewNewsSection alapján automatikus nézet váltás
  React.useEffect(() => {
    if (showNewNewsSection && activeNewNewsTab) {
      setActiveView('newNews');
    } else {
      setActiveView('filter');
    }
  }, [showNewNewsSection, activeNewNewsTab]);

  return (
    <aside className={styles.sidebar}>
      <SideHeader
        onActivateTab={onActivateTab}
        loadLocalContent={loadLocalContent}
        isLocationLoading={isLocationLoading}
        openRightPanelWithMode={openRightPanelWithMode}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Kondicionális renderelés a nézetek alapján */}
      {activeView === 'filter' && (
        <div className={styles.filterView}>
          <Search onSearchTabOpen={onSearchTabOpen} onVideoTabOpen={onVideoTabOpen} />

          {/* ÚJ: Tartalom típus gombok */}
          <ContentTypeToggles
            activeContentType={contentType}
            onContentTypeChange={(type) => {
              setContentType(type);
              console.log('[Side] ContentType váltás:', type);
              onContentTypeChange(type);
            }}
          />

          {/* ÚJ: Keresési mód gombok - KIKOMMENTELVE */}
          {/* <SearchModeToggles
            activeSearchMode={activeSearchMode}
            onSearchModeChange={onSearchModeChange}
          /> */}

          <Country 
            selectedCountry={selectedCountry} 
            onCountrySelect={handleCountrySelect}
            activeSearchMode={activeSearchMode}
            onSearchModeChange={onSearchModeChange}
            contentType={contentType}
            // ÚJ: SideAd callback-ek
            onSearchActiveChange={setIsCountrySearchActive}
            onSearchResultsChange={setCountrySearchResults}
            onActiveLetterChange={setActiveLetter}
          />

          {/* Dinamikus hírdetés pozíció - ELTÁVOLÍTVA a filterView-ból */}
          {/* <SideAd 
            isSearchActive={isCountrySearchActive}
            searchResults={countrySearchResults}
            position={isCountrySearchActive ? 'below-search-results' : 'below-countries'}
            activeLetter={activeLetter || undefined}
          /> */}

          {/* <Continent
            selectedContinent={selectedContinent}
            onContinentSelect={handleContinentSelect}
          /> */}
        </div>
      )}

      {activeView === 'newNews' && (
        <div className={styles.newNewsView}>
          <NewNewsSection
            tabId={activeNewNewsTab || 'general'}
            newsList={mockNewsList}
            onClose={handleCloseNewNews}
          />
        </div>
      )}

      {/* Sticky reklám a Side panel alján, mindig látható */}
      {/* <SideAdSticky /> */}
    </aside>
  );
};
