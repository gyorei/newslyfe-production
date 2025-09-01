import { useMemo } from 'react';
import { TerminalAnimationData } from './sourceData';
import { prepareTerminalAnimationData, hasCountryData } from './sourceDataLoader';

/**
 * Hook a valós forrás adatok betöltéséhez és feldolgozásához
 * LoadingProgressOverlay komponens számára
 */
export function useLoadingProgressData(countryName: string | null) {
  
  const terminalData = useMemo((): TerminalAnimationData | null => {
    if (!countryName) {
      return null;
    }
    
    // Valós adatok betöltése JSONC-ből
    return prepareTerminalAnimationData(countryName);
  }, [countryName]);
  
  const isDataAvailable = useMemo(() => {
    if (!countryName) return false;
    return hasCountryData(countryName);
  }, [countryName]);
  
  // Terminál animáció szövegek generálása angol nyelven
  const generateTerminalMessages = useMemo(() => {
    if (!terminalData) {
      return {
        initMessages: [],
        connectionMessages: [],
        completionMessages: []
      };
    }
    
    const { countryName, sourceCount, sampleSources } = terminalData;
    const timestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
    
    // Phase 1: Initialization
    const initMessages = [
      `[${timestamp()}] INIT ▶ Target: ${countryName}`,
      `[${timestamp()}] REQUESTING SOURCE MANIFEST...`,
      `[${timestamp()}] SOURCES FOUND: ${sourceCount} providers`
    ];
    
    // Phase 2: Source Connections (első 25 forrás)
    const connectionMessages = sampleSources.map(source => 
      `[${timestamp()}] CONNECT ▶ ${source.domain} ... OK (${source.latency}ms)`
    );
    
    // Ha több forrás van, mint amit animálunk
    if (sourceCount > sampleSources.length) {
      connectionMessages.push(
        `[${timestamp()}] BATCH COMPLETE ▶ ${sampleSources.length}/${sourceCount} connected`,
        `[${timestamp()}] REMAINING SOURCES ▶ connecting in background...`
      );
    }
    
    connectionMessages.push(`[${timestamp()}] ALL SOURCES CONNECTED (${sourceCount}/${sourceCount})`);
    
    // Phase 3: Completion & Stats
    const avgLatency = Math.round(
      sampleSources.reduce((sum, s) => sum + s.latency, 0) / sampleSources.length
    );
    
    const completionMessages = [
      `[${timestamp()}] FETCH ▶ Requesting articles...`,
      `[${timestamp()}] PARSING ▶ Processing content...`,
      `[${timestamp()}] RENDER ▶ ${countryName} news ready`,
      `[${timestamp()}] DONE ▶ Loading complete`,
      `─────────────────────────────`,
      `SOURCES: ${sourceCount} (${sourceCount} connected)`,
      `AVG LATENCY: ~${avgLatency}ms`,
      `ERRORS: 0`,
      `─────────────────────────────`
    ];
    
    return {
      initMessages,
      connectionMessages,
      completionMessages
    };
    
  }, [terminalData]);
  
  return {
    // Valós adatok
    terminalData,
    isDataAvailable,
    
    // Animációhoz előkészített szövegek
    terminalMessages: generateTerminalMessages,
    
    // Hasznos metrikák
    sourceCount: terminalData?.sourceCount || 0,
    countryName: terminalData?.countryName || '',
    
    // Státusz
    hasData: !!terminalData
  };
}