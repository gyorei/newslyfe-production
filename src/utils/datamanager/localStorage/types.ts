/**
 * LocalStorage-specifikus típusok és interfészek
 * src\utils\datamanager\localStorage\types.ts
 */

/**
 * LocalStorage opciók
 */
export interface LocalStorageOptions {
  namespace?: string; // Névtér a localStorage kulcsokhoz
  expiry?: number; // Lejárat időbélyege (opcionális)
}

/**
 * A fül definíciója
 */
export interface TabDefinition {
  id: string;
  title: string;
  mode: string; // pl. 'feed', 'article', 'search', 'saved'
  // egyéb tab specifikus adatok
  [key: string]: unknown; // any helyett unknown
}

/**
 * A fülek állapota
 */
export interface TabsState {
  activeId: string;
  definitions: TabDefinition[];
}

/**
 * A felhasználói felület panelek állapota
 */
export interface UIPanelStates {
  left: boolean;
  right: boolean;
}

/**
 * A felhasználói felület állapota
 */
export interface UIState {
  panelStates: UIPanelStates;
  utilityMode: string; // pl. 'standard'
}

/**
 * Eszköz preferenciák
 */
export interface DevicePreferences {
  fontSize: number;
  darkMode: boolean;
}

/**
 * LocalStorage-ban tárolt adatok
 */
export interface LocalStorageData {
  version: string;
  timestamp: number;
  tabs?: TabsState;
  ui?: UIState;
  devicePreferences?: DevicePreferences;
  savedArticles?: string[]; // A mentett cikkek azonosítói
  // Egyéb, localStorage-ban tárolt adatok
  [key: string]: unknown; // any helyett unknown
}
