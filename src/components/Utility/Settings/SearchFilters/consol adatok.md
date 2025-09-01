szia magyarul írj 
// ezzel jó a keresés a war szóra a találatok megjelennek de 
Deselect All nem teszi láthatatlaná a találatokat. 
// találatokat Deselect All tünteti el és a Select All hozza vissza kattintásra. ezt kell módosíttani úgy hogy
// ha a Deselect All-ra kattintunk,
// üres legyen, így nem jelennek meg találatok.
// Nem törlni kell a találatokat 

let filteredByCountry = sourceItems;

if (mode === 'search' || mode === 'home') {

  if (!currentFilters.countries || currentFilters.countries.length === 0) {
    filteredByCountry = sourceItems;
    console.log('[TabPanel] Országszűrés KIHAGYVA keresésnél (nincs kiválasztott ország):', {
      originalCount: sourceItems.length,
      filteredCount: sourceItems.length,
      selectedCountries: currentFilters.countries,
    });
  } else {
    // Csak akkor szűrjünk, ha van kiválasztott ország
    filteredByCountry = sourceItems.filter((item) => {
      const itemCountryCode = item.countryCode || item.country;
      return itemCountryCode && currentFilters.countries.includes(itemCountryCode);
    });
    console.log('[TabPanel] Országszűrés alkalmazva keresésnél:', {
      originalCount: sourceItems.length,
      filteredCount: filteredByCountry.length,
      selectedCountries: currentFilters.countries,
    });
  }
} else {
  // ...existing code for non-search/home modes...
}
==========================================================

itt a consol log adatok !!

SearchFilters.tsx:99 [SearchFilters] Deselect All kattintva, countries: []
SearchResultsMetadataBridge.ts:60 [SearchResultsMetadataBridge] Subscriber removed. Total listeners: 0 (was 1)
useSearchFilters.ts:25 [Országszűrés] Aktív országkódok: []
useSearchFilters.ts:27 [Országszűrés] URL: http://localhost:3000/
SearchFiltersBridge.ts:62 [SearchFiltersBridge] Emitting FILTER_CHANGE: {lang: 'all', countries: Array(0)}
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(0)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: filtered-tab-1756100670169 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: filtered-tab-1756100670169 -> page 1, 50 items/page
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(0)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: tab-1756100663988 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: tab-1756100663988 -> page 1, 50 items/page
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(0)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: tab-1756105501382 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: tab-1756105501382 -> page 1, 50 items/page
SearchFilters.tsx:56 [SearchFilters] useEffect indítás, tab: tab-1756105501382
SearchResultsMetadataBridge.ts:123 [SearchResultsMetadataBridge] Retrieved metadata for tab tab-1756105501382, age: 335287ms
SearchFilters.tsx:64 [SearchFilters] Meglévő metaadatok: {countries: Array(3), timestamp: 1756105519340}
SearchFilters.tsx:31 [SearchFilters] updateOptions hívva, opciók: (3) [{…}, {…}, {…}]
SearchResultsMetadataBridge.ts:50 [SearchResultsMetadataBridge] New subscriber added. Total listeners: 1
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756100663988 isActive: false mode: search
TabPanel.tsx:576 [TabPanel] Országszűrés KIHAGYVA keresésnél (nincs kiválasztott ország): {originalCount: 49, filteredCount: 49, selectedCountries: Array(0)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756100663988 isActive: false mode: search
TabPanel.tsx:576 [TabPanel] Országszűrés KIHAGYVA keresésnél (nincs kiválasztott ország): {originalCount: 49, filteredCount: 49, selectedCountries: Array(0)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: filtered-tab-1756100670169 isActive: false mode: news
TabPanel.tsx:76 [TabPanel] Render, activeTabId: filtered-tab-1756100670169 isActive: false mode: news
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756105501382 isActive: true mode: search
TabPanel.tsx:576 [TabPanel] Országszűrés KIHAGYVA keresésnél (nincs kiválasztott ország): {originalCount: 49, filteredCount: 49, selectedCountries: Array(0)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756105501382 isActive: true mode: search
TabPanel.tsx:576 [TabPanel] Országszűrés KIHAGYVA keresésnél (nincs kiválasztott ország): {originalCount: 49, filteredCount: 49, selectedCountries: Array(0)}
ScrollContainer.tsx:73 [ScrollContainer][tab-1756100663988-search] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​
ScrollContainer.tsx:75 [ScrollContainer][tab-1756100663988-search] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​
debugTools.ts:49 [DEBUG] TabPanel (🔍 war) render count: 9
ScrollContainer.tsx:73 [ScrollContainer][filtered-tab-1756100670169-news] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​
ScrollContainer.tsx:75 [ScrollContainer][filtered-tab-1756100670169-news] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​
debugTools.ts:49 [DEBUG] TabPanel (Belgium) render count: 175
ScrollContainer.tsx:73 [ScrollContainer][tab-1756105501382-search] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​scroll
ScrollContainer.tsx:75 [ScrollContainer][tab-1756105501382-search] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​scroll
debugTools.ts:49 [DEBUG] TabPanel (🔍 war) render count: 10
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
SearchFilters.tsx:109 [SearchFilters] Select All kattintva, countries: (3) ['US', 'Belgium', 'GB']
SearchResultsMetadataBridge.ts:60 [SearchResultsMetadataBridge] Subscriber removed. Total listeners: 0 (was 1)
useSearchFilters.ts:25 [Országszűrés] Aktív országkódok: (3) ['US', 'Belgium', 'GB']
useSearchFilters.ts:27 [Országszűrés] URL: http://localhost:3000/?countries=US%2CBelgium%2CGB
SearchFiltersBridge.ts:62 [SearchFiltersBridge] Emitting FILTER_CHANGE: {lang: 'all', countries: Array(3)}
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(3)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: filtered-tab-1756100670169 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: filtered-tab-1756100670169 -> page 1, 50 items/page
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(3)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: tab-1756100663988 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: tab-1756100663988 -> page 1, 50 items/page
TabPanel.tsx:295 [TabPanel] Szűrők frissítése: {lang: 'all', countries: Array(3)}
useTabPagination.ts:23 [useTabPagination] Pagination állapot mentése: tab-1756105501382 -> page 1, 50 items/page
PaginationStorage.ts:46 [PaginationStorage] Saved: tab-1756105501382 -> page 1, 50 items/page
SearchFilters.tsx:56 [SearchFilters] useEffect indítás, tab: tab-1756105501382
SearchResultsMetadataBridge.ts:123 [SearchResultsMetadataBridge] Retrieved metadata for tab tab-1756105501382, age: 337807ms
SearchFilters.tsx:64 [SearchFilters] Meglévő metaadatok: {countries: Array(3), timestamp: 1756105519340}
SearchFilters.tsx:31 [SearchFilters] updateOptions hívva, opciók: (3) [{…}, {…}, {…}]
SearchResultsMetadataBridge.ts:50 [SearchResultsMetadataBridge] New subscriber added. Total listeners: 1
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756100663988 isActive: false mode: search
TabPanel.tsx:587 [TabPanel] Országszűrés alkalmazva keresésnél: {originalCount: 49, filteredCount: 49, selectedCountries: Array(3)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756100663988 isActive: false mode: search
TabPanel.tsx:587 [TabPanel] Országszűrés alkalmazva keresésnél: {originalCount: 49, filteredCount: 49, selectedCountries: Array(3)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: filtered-tab-1756100670169 isActive: false mode: news
TabPanel.tsx:76 [TabPanel] Render, activeTabId: filtered-tab-1756100670169 isActive: false mode: news
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756105501382 isActive: true mode: search
TabPanel.tsx:587 [TabPanel] Országszűrés alkalmazva keresésnél: {originalCount: 49, filteredCount: 49, selectedCountries: Array(3)}
TabPanel.tsx:76 [TabPanel] Render, activeTabId: tab-1756105501382 isActive: true mode: search
TabPanel.tsx:587 [TabPanel] Országszűrés alkalmazva keresésnél: {originalCount: 49, filteredCount: 49, selectedCountries: Array(3)}
ScrollContainer.tsx:73 [ScrollContainer][tab-1756100663988-search] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​
ScrollContainer.tsx:75 [ScrollContainer][tab-1756100663988-search] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​
debugTools.ts:49 [DEBUG] TabPanel (🔍 war) render count: 10
ScrollContainer.tsx:73 [ScrollContainer][filtered-tab-1756100670169-news] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​
ScrollContainer.tsx:75 [ScrollContainer][filtered-tab-1756100670169-news] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​
debugTools.ts:49 [DEBUG] TabPanel (Belgium) render count: 176
ScrollContainer.tsx:73 [ScrollContainer][tab-1756105501382-search] [NEWS] Görgethető elem keresése: <div class=​"_panelContent_1n1xa_13">​…​</div>​scroll
ScrollContainer.tsx:75 [ScrollContainer][tab-1756105501382-search] ✅ Belső görgethető elem beállítva: <div class=​"_panelContent_1n1xa_13">​…​</div>​scroll
debugTools.ts:49 [DEBUG] TabPanel (🔍 war) render count: 11
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
AdSenseLayout.tsx:139 [AdSenseLayout] 🎭 Reklám első betöltése kész
