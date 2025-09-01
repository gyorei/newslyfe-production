/**
 * Adatáramlás debugger - ideiglenesen beilleszthető komponensekbe
 *
 * @param componentName A komponens neve
 * @param data Az átadott adatok
 */
export function traceDataFlow(componentName: string, data: unknown) {
  // Csak development módban fusson
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group(`🔍 Data Flow: ${componentName}`);
  console.log('Data:', data);
  console.trace('Component stack:');
  console.groupEnd();
}

/**
 * Komponens render számláló - performance debughoz
 * @param tag Egyedi címke (pl. komponens neve)
 */

/*
import { useDebugRender } from '../../utils/debugTools/debugTools';

export const Panel = (props) => {
  useDebugRender('Panel');
  // ...
};
...
export const Panel: React.FC<PanelProps> = ({
  activeTabId, title, newsItems = [], loading = false, error = null, onRetry, onToggleMenu,
  searchResults = [], searchTerm, isSearchMode = false, onClearSearch
}) => {
  useDebugRender('Panel'); // <-- IDE!

  // ...többi state, logika, return stb.

*/

import { useRef, useEffect } from 'react';

export function useDebugRender(tag: string) {
  const renderRef = useRef(0);
  useEffect(() => {
    renderRef.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${tag} render count: ${renderRef.current}`);
    }
  });
}
