// 📰 News Detection Module - Export Barrel
// Utolsó frissítés: 2025.06.01

// Fő osztályok
export { NewNewsDetector } from './NewNewsDetector';
export { NewsStorage } from './NewsStorage';

// TypeScript interface-ek és típusok
export type { LastCheckState, NewsItem, DetectionResult, DetectionDebugInfo } from './types';

// Konstansok
export { STORAGE_KEYS } from './types';

// Convenience export - egyszerű használatra
import { NewNewsDetector } from './NewNewsDetector';
export const createNewsDetector = () => new NewNewsDetector();
