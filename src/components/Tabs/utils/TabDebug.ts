/**
 * Központosított debug utility a Tab komponensek számára
 * Egyszerűsíti a debug kódok kezelését és eltávolítását production környezetben
 */

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG_ENABLED = IS_DEVELOPMENT;

interface DragEventData {
  type: string;
  [key: string]: unknown;
}

interface TabOperationDetails {
  [key: string]: unknown;
}

export const TabDebug = {
  performance: {
    start: (label: string) => {
      if (DEBUG_ENABLED) {
        console.time(label);
      }
    },

    end: (label: string, additionalInfo?: string) => {
      if (DEBUG_ENABLED) {
        console.timeEnd(label);
        if (additionalInfo) {
          console.log(additionalInfo);
        }
      }
    },
  },

  interaction: {
    drag: (event: DragEventData) => {
      if (DEBUG_ENABLED) {
        console.log('🎯 Drag event:', event.type, event);
      }
    },

    tabOperation: (operation: string, tabId: string, details?: TabOperationDetails) => {
      if (DEBUG_ENABLED) {
        console.log(`🔄 Tab ${operation}:`, tabId, details);
      }
    },

    badgeClick: (tabId: string) => {
      if (DEBUG_ENABLED) {
        console.log(`🔔 Badge clicked for tab: ${tabId}`);
      }
    },
  },

  state: {
    tabCount: (count: number, optimized: boolean) => {
      if (DEBUG_ENABLED) {
        console.log(`📊 Tab count: ${count}, Optimized rendering: ${optimized}`);
      }
    },
  },
};
