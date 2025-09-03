/**
 * Image Extractor - Fő Export Modul
 * 
 * Ez a fájl biztosítja a tiszta API-t az image extractor funkcionalitáshoz.
 * Minden fontos függvény és típus itt exportálódik.
 */

// Fő képkinyerési függvények
export {
  extractBestImage,
  extractImageWithDetails,
  extractBestImageUniversal,
  extractAllImageCandidates
} from './imageExtractor.js';

// Stratégia függvények
export {
  extractImageFromEnclosure,
  extractImageFromImageTag,
  extractImageFromMediaThumbnail,
  extractImageFromMediaContent,
  extractImageFromDescription,
  extractImageFromContentEncoded,
  SYNC_STRATEGIES
} from './imageExtractorStrategies.js';

// DOM parser függvények
export {
  extractImagesWithDOM,
  extractImageFromContentEncodedDOM,
  extractImageFromDescriptionDOM,
  testDOMParser
} from './imageExtractorDOM.js';

// Minőség elemzés függvények
export {
  analyzeImageQuality,
  calculateAttributeBasedConfidence,
  calculateImageQualityMetrics,
  testAttributeConfidence
} from './imageExtractorQuality.js';

// Dinamikus konfidencia függvények
export {
  calculateDynamicConfidence,
  setFeedConfidenceOverrides,
  getFeedProfileStats,
  getCacheStats,
  testDynamicConfidence
} from './imageExtractorDynamicConfidence.js';

// Web scraping függvények
export {
  extractImageFromWebPageWithFallback,
  extractImageFromNemzetiOnvedelem,
  extractImageFromWebPageUniversal,
  isAlJazeeraLogo,
  getWebScrapingDebugInfo,
  testWebScraping
} from './imageExtractorWebScraping.js';

// Segédfüggvények
export {
  validateAndCleanImageUrl,
  isTooSmallImage,
  cleanCDATA,
  decodeHtmlEntities,
  detectLogoGlobally,
  robustHtmlCleaner,
  testLogImprovements
} from './imageExtractorUtils.js';

// Batch feldolgozás függvények
export {
  extractImagesFromItemsBatch,
  generateImageExtractionStats,
  extractImagesFromItems,
  processBatchWithConcurrency,
  processBatchWithMemoryOptimization,
  generatePerformanceMetrics,
  logBatchProcessingStats
} from './imageExtractorBatch.js';

// Típusok exportálása a megfelelő modulokból
export type {
  RssItem,
  ImageExtractionResult,
  ImageCandidate
} from './imageExtractorStrategies.js';

export type {
  FeedProfile
} from './imageExtractorDynamicConfidence.js';

export type {
  ImageQualityMetrics
} from './imageExtractorQuality.js';

export type {
  BatchProcessingConfig,
  BatchProcessingResult
} from './imageExtractorBatch.js';

export type {
  LogoDetectionResult
} from './imageExtractorUtils.js';

// Alias exportok a kompatibilitáshoz
export {
  // Régi nevek kompatibilitáshoz
  extractBestImage as extractImage,
  extractImageWithDetails as extractImageDetailed,
  extractBestImageUniversal as extractImageUniversal
} from './imageExtractor.js'; 