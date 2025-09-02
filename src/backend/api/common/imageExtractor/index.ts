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
} from './imageExtractor';

// Stratégia függvények
export {
  extractImageFromEnclosure,
  extractImageFromImageTag,
  extractImageFromMediaThumbnail,
  extractImageFromMediaContent,
  extractImageFromDescription,
  extractImageFromContentEncoded,
  SYNC_STRATEGIES
} from './imageExtractorStrategies';

// DOM parser függvények
export {
  extractImagesWithDOM,
  extractImageFromContentEncodedDOM,
  extractImageFromDescriptionDOM,
  testDOMParser
} from './imageExtractorDOM';

// Minőség elemzés függvények
export {
  analyzeImageQuality,
  calculateAttributeBasedConfidence,
  calculateImageQualityMetrics,
  testAttributeConfidence
} from './imageExtractorQuality';

// Dinamikus konfidencia függvények
export {
  calculateDynamicConfidence,
  setFeedConfidenceOverrides,
  getFeedProfileStats,
  getCacheStats,
  testDynamicConfidence
} from './imageExtractorDynamicConfidence';

// Web scraping függvények
export {
  extractImageFromWebPageWithFallback,
  extractImageFromNemzetiOnvedelem,
  extractImageFromWebPageUniversal,
  isAlJazeeraLogo,
  getWebScrapingDebugInfo,
  testWebScraping
} from './imageExtractorWebScraping';

// Segédfüggvények
export {
  validateAndCleanImageUrl,
  isTooSmallImage,
  cleanCDATA,
  decodeHtmlEntities,
  detectLogoGlobally,
  robustHtmlCleaner,
  testLogImprovements
} from './imageExtractorUtils';

// Batch feldolgozás függvények
export {
  extractImagesFromItemsBatch,
  generateImageExtractionStats,
  extractImagesFromItems,
  processBatchWithConcurrency,
  processBatchWithMemoryOptimization,
  generatePerformanceMetrics,
  logBatchProcessingStats
} from './imageExtractorBatch';

// Típusok exportálása a megfelelő modulokból
export type {
  RssItem,
  ImageExtractionResult,
  ImageCandidate
} from './imageExtractorStrategies';

export type {
  FeedProfile
} from './imageExtractorDynamicConfidence';

export type {
  ImageQualityMetrics
} from './imageExtractorQuality';

export type {
  BatchProcessingConfig,
  BatchProcessingResult
} from './imageExtractorBatch';

export type {
  LogoDetectionResult
} from './imageExtractorUtils';

// Alias exportok a kompatibilitáshoz
export {
  // Régi nevek kompatibilitáshoz
  extractBestImage as extractImage,
  extractImageWithDetails as extractImageDetailed,
  extractBestImageUniversal as extractImageUniversal
} from './imageExtractor'; 