import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingProgressState {
  isVisible: boolean;
  status: 'init' | 'connecting' | 'fetching' | 'processing' | 'done' | 'error';
  country: string;
  tabId: string;
  sources: Array<{id: string, name: string, domain: string}>;
  connectedSources: number;
  fetchedArticles: number;
  totalArticles: number;
  logs: string[];
  startTime: number;
}

export interface ProgressUpdate {
  status?: LoadingProgressState['status'];
  sources?: LoadingProgressState['sources'];
  totalArticles?: number;
  fetchedArticles?: number;
  message?: string;
}

const initialState: LoadingProgressState = {
  isVisible: false,
  status: 'init',
  country: '',
  tabId: '',
  sources: [],
  connectedSources: 0,
  fetchedArticles: 0,
  totalArticles: 0,
  logs: [],
  startTime: 0,
};

export const useLoadingProgress = (tabId: string) => {
  // ✅ Tab-specifikus állapotkezelés Map-pel
  const progressMapRef = useRef<Map<string, LoadingProgressState>>(new Map());
  const [, forceUpdate] = useState({});
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout[]>>(new Map());

  // ✅ Force re-render function
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // ✅ Get current progress state for this tab
  const getProgressState = useCallback(() => {
    return progressMapRef.current.get(tabId) || initialState;
  }, [tabId]);

  // ✅ Update progress state for this tab
  const updateProgressState = useCallback((updates: Partial<LoadingProgressState>) => {
    const currentState = progressMapRef.current.get(tabId) || initialState;
    const newState = { ...currentState, ...updates };
    progressMapRef.current.set(tabId, newState);
    triggerUpdate();
  }, [tabId, triggerUpdate]);

  // ✅ Add log entry
  const addLog = useCallback((message: string) => {
    const currentState = getProgressState();
    updateProgressState({
      logs: [...currentState.logs, message],
    });
  }, [getProgressState, updateProgressState]);

  // ✅ Hide progress overlay
  const hideProgress = useCallback(() => {
    console.log(`[useLoadingProgress] 🏁 Hiding progress for tab ${tabId}`);
    
    const timeouts = timeoutRefs.current.get(tabId) || [];
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.delete(tabId);
    
    updateProgressState({
      isVisible: false,
    });
  }, [tabId, updateProgressState]);

  // ✅ Source connection simulation  
  const startSourceConnectionSimulation = useCallback((sources: LoadingProgressState['sources']) => {
    const timeouts: NodeJS.Timeout[] = [];
    
    sources.forEach((source, index) => {
      const delay = index * (100 + Math.random() * 100); // 100-200ms between connections
      
      const timeout = setTimeout(() => {
        const latency = Math.random() * 150 + 80; // 80-230ms
        addLog(`[${getCurrentTime()}] CONNECT ▶ ${source.domain} ... ok (${Math.round(latency)}ms)`);
        
        const currentState = getProgressState();
        updateProgressState({
          connectedSources: currentState.connectedSources + 1,
        });
      }, delay);
      
      timeouts.push(timeout);
    });
    
    // Store timeouts for cleanup
    const existingTimeouts = timeoutRefs.current.get(tabId) || [];
    timeoutRefs.current.set(tabId, [...existingTimeouts, ...timeouts]);
  }, [tabId, addLog, getProgressState, updateProgressState]);

  // ✅ News processing simulation
  const startNewsProcessingSimulation = useCallback((totalNews: number) => {
    // Limit simulation for performance - max 60 log entries
    const limitedNews = Math.min(totalNews, 60);
    const batchSize = 5;
    const batches = Math.ceil(limitedNews / batchSize);
    const timeouts: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < batches; i++) {
      const delay = i * 200; // 200ms between batches
      
      const timeout = setTimeout(() => {
        const processed = Math.min((i + 1) * batchSize, limitedNews);
        addLog(`[${getCurrentTime()}] RECV ${processed}/${totalNews} ▶ Processing articles...`);
        
        // Final processing message
        if (processed === limitedNews || i === batches - 1) {
          setTimeout(() => {
            addLog(`[${getCurrentTime()}] PARSE ▶ ${totalNews} articles processed`);
            updateProgressState({
              status: 'done',
            });
            
            // ✅ KRITIKUS JAVÍTÁS: DONE állapotban AZONNAL elrejtjük az overlay-t
            setTimeout(() => {
              console.log(`[useLoadingProgress] 🏁 Auto-hide after DONE status for tab ${tabId}`);
              updateProgressState({
                isVisible: false,
              });
            }, 500); // 500ms késleltetés, hogy láthassa a "done" üzenetet
          }, 300);
        }
      }, delay);
      
      timeouts.push(timeout);
    }
    
    // Store timeouts for cleanup
    const existingTimeouts = timeoutRefs.current.get(tabId) || [];
    timeoutRefs.current.set(tabId, [...existingTimeouts, ...timeouts]);
  }, [tabId, addLog, updateProgressState]);

  // ✅ Update progress with API data - MOST már minden függvény létezik
  const updateProgress = useCallback((update: ProgressUpdate) => {
    const currentState = getProgressState();
    
    if (update.message) {
      addLog(`[${getCurrentTime()}] ${update.message}`);
    }
    
    const updates: Partial<LoadingProgressState> = {};
    
    if (update.status) {
      updates.status = update.status;
    }
    
    if (update.sources) {
      updates.sources = update.sources;
      // Start source connection simulation
      startSourceConnectionSimulation(update.sources);
    }
    
    if (update.totalArticles !== undefined) {
      updates.totalArticles = update.totalArticles;
    }
    
    if (update.fetchedArticles !== undefined) {
      updates.fetchedArticles = update.fetchedArticles;
      
      // Start news processing simulation if we have articles
      if (update.fetchedArticles > 0 && currentState.connectedSources === currentState.sources.length) {
        startNewsProcessingSimulation(update.fetchedArticles);
      }
    }
    
    updateProgressState(updates);
  }, [getProgressState, addLog, updateProgressState, startSourceConnectionSimulation, startNewsProcessingSimulation]);

  // ✅ Start progress animation
  const startProgress = useCallback((country: string) => {
    console.log(`[useLoadingProgress] 🚀 Starting progress for ${country} in tab ${tabId}`);
    
    // Clear any existing timeouts for this tab
    const existingTimeouts = timeoutRefs.current.get(tabId) || [];
    existingTimeouts.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.set(tabId, []);
    
    updateProgressState({
      isVisible: true,
      status: 'init',
      country,
      tabId,
      sources: [],
      connectedSources: 0,
      fetchedArticles: 0,
      totalArticles: 0,
      logs: [`[${getCurrentTime()}] INIT ▶ Target: ${country.toUpperCase()}, scanning sources...`],
      startTime: Date.now(),
    });
  }, [tabId, updateProgressState]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    const currentTabId = tabId;
    const currentTimeoutRefs = timeoutRefs.current;
    const currentProgressMapRef = progressMapRef.current;
    
    return () => {
      const timeouts = currentTimeoutRefs.get(currentTabId) || [];
      timeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeoutRefs.delete(currentTabId);
      currentProgressMapRef.delete(currentTabId);
    };
  }, [tabId]);

  return {
    progressState: getProgressState(),
    startProgress,
    updateProgress,
    addLog,
    hideProgress,
  };
};

// ✅ Utility function for timestamps
function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}