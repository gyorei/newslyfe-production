/**
 * Image Extractor Quality - Képminőség elemzés és jelölt értékelés
 * 
 * Ez a modul felelős a képek minőségének elemzéséért és
 * a kép jelöltek rangsorolásáért.
 */

// Importáljuk a szükséges típusokat és segédfüggvényeket
import { RssItem } from './imageExtractorStrategies.js';
import { validateAndCleanImageUrl, isTooSmallImage } from './imageExtractorUtils.js';

// ✅ TELJESÍTMÉNY OPTIMALIZÁLÁS: Előre kompilált regex objektumok
const SIZE_MATCH_REGEX = /[_\-\/](\d+)x(\d+)[_\-\/]/;

/**
 * Kép jelölt - Több kép próbálkozás támogatásához
 */
export interface ImageCandidate {
  url: string;
  source: string;
  confidence: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  quality: number; // 0-1, összetett minőség pontszám
  attributes?: {
    width?: string;
    height?: string;
    type?: string;
  };
}

/**
 * Képminőség elemzés - Egyszerű és hatékony
 */
export function analyzeImageQuality(
  url: string, 
  attributes?: { width?: string; height?: string; type?: string }
): number {
  let quality = 0.5; // Alap minőség
  
  // 1. Méret elemzés (ha van attribútum)
  if (attributes?.width && attributes?.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    
    if (width >= 300 && height >= 200) quality += 0.2;
    if (width >= 600 && height >= 400) quality += 0.3;
    if (width < 100 || height < 100) quality -= 0.3; // Túl kicsi
  }
  
  // 2. URL elemzés - Logo/placeholder kiszűrése
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('logo') || lowerUrl.includes('placeholder') || 
      lowerUrl.includes('default') || lowerUrl.includes('1x1')) {
    quality -= 0.4; // Logo/placeholder súlyos levonás
  }
  
  // 3. Kiterjesztés elemzés
  if (url.match(/\.(jpg|jpeg|png|webp)$/i)) quality += 0.1;
  if (url.match(/\.(gif|svg)$/i)) quality -= 0.1; // GIF/SVG kevésbé preferált
  
  // 4. Méret URL-ből (ha nincs attribútum)
  const sizeMatch = url.match(/[_\-\/](\d+)x(\d+)[_\-\/]/);
  if (sizeMatch && !attributes?.width) {
    const width = parseInt(sizeMatch[1]);
    const height = parseInt(sizeMatch[2]);
    if (width >= 300 && height >= 200) quality += 0.15;
  }
  
  return Math.max(0, Math.min(1, quality)); // 0-1 között
}

/**
 * Attribútum alapú konfidencia növelés
 */
export function calculateAttributeBasedConfidence(
  baseConfidence: number,
  attributes?: { width?: string; height?: string; type?: string }
): number {
  let multiplier = 1.0;
  
  // 1. Méret alapú növelés
  if (attributes?.width && attributes?.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    
    if (width >= 300 && height >= 200) multiplier *= 1.2;
    if (width >= 600 && height >= 400) multiplier *= 1.3;
    if (width >= 800 && height >= 600) multiplier *= 1.4;
    
    // Túl kicsi képek levonása
    if (width < 100 || height < 100) multiplier *= 0.7;
  }
  
  // 2. Típus alapú növelés
  if (attributes?.type?.startsWith('image/')) {
    multiplier *= 1.1;
    
    // Specifikus formátumok
    if (attributes.type.includes('jpeg') || attributes.type.includes('jpg')) multiplier *= 1.05;
    if (attributes.type.includes('png')) multiplier *= 1.03;
    if (attributes.type.includes('webp')) multiplier *= 1.08; // Modern formátum
    if (attributes.type.includes('gif')) multiplier *= 0.9; // Kevésbé preferált
  }
  
  // 3. Aspect ratio elemzés (ha van méret)
  if (attributes?.width && attributes?.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    const aspectRatio = width / height;
    
    // Preferált aspect ratio-k
    if (Math.abs(aspectRatio - 16/9) < 0.1) multiplier *= 1.1; // 16:9
    if (Math.abs(aspectRatio - 4/3) < 0.1) multiplier *= 1.05; // 4:3
    if (Math.abs(aspectRatio - 1) < 0.1) multiplier *= 1.02; // 1:1
    
    // Kevésbé preferált aspect ratio-k
    if (aspectRatio > 3 || aspectRatio < 0.3) multiplier *= 0.8; // Túl széles/vékony
  }
  
  return Math.min(baseConfidence * multiplier, 1.0);
}

/**
 * Képminőség elemzés részletes metrikákkal
 */
export interface ImageQualityMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  totalPixels: number;
  qualityScore: number;
  sizeCategory: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
}

export function calculateImageQualityMetrics(
  url: string, 
  attributes?: { width?: string; height?: string; type?: string }
): ImageQualityMetrics {
  let width = 0;
  let height = 0;
  
  // 1. Attribútumokból kinyerés
  if (attributes?.width && attributes?.height) {
    width = parseInt(attributes.width);
    height = parseInt(attributes.height);
  }
  
  // 2. URL-ből kinyerés (fallback)
  if (width === 0 || height === 0) {
    const sizeMatch = SIZE_MATCH_REGEX.exec(url);
    if (sizeMatch) {
      width = parseInt(sizeMatch[1]);
      height = parseInt(sizeMatch[2]);
    }
  }
  
  // 3. Alapértelmezett értékek
  if (width === 0 || height === 0) {
    width = 300; // Default width
    height = 200; // Default height
  }
  
  const totalPixels = width * height;
  const aspectRatio = width / height;
  
  // 4. Méret kategória meghatározása
  let sizeCategory: ImageQualityMetrics['sizeCategory'];
  if (totalPixels < 2500) sizeCategory = 'tiny';
  else if (totalPixels < 10000) sizeCategory = 'small';
  else if (totalPixels < 50000) sizeCategory = 'medium';
  else if (totalPixels < 200000) sizeCategory = 'large';
  else sizeCategory = 'huge';
  
  // 5. Minőség pontozás
  let qualityScore = 0.5; // Base score
  
  // Méret alapú pontozás
  const sizeScores = {
    'tiny': 0.1,
    'small': 0.3,
    'medium': 0.6,
    'large': 0.8,
    'huge': 0.9
  };
  qualityScore = sizeScores[sizeCategory];
  
  // Aspect ratio pontozás (16:9, 4:3, 1:1 preferált)
  const aspectScores = {
    '16:9': 1.0,
    '4:3': 0.9,
    '1:1': 0.8,
    '3:2': 0.7
  };
  
  const aspectKey = getAspectRatioKey(aspectRatio);
  if (aspectScores[aspectKey as keyof typeof aspectScores]) {
    qualityScore *= aspectScores[aspectKey as keyof typeof aspectScores];
  }
  
  // Formátum pontozás
  if (url.match(/\.webp$/i)) qualityScore *= 1.1;
  else if (url.match(/\.png$/i)) qualityScore *= 1.05;
  
  return {
    width,
    height,
    aspectRatio,
    totalPixels,
    qualityScore: Math.min(qualityScore, 1.0),
    sizeCategory
  };
}

function getAspectRatioKey(ratio: number): string {
  const tolerance = 0.1;
  if (Math.abs(ratio - 16/9) < tolerance) return '16:9';
  if (Math.abs(ratio - 4/3) < tolerance) return '4:3';
  if (Math.abs(ratio - 1) < tolerance) return '1:1';
  if (Math.abs(ratio - 3/2) < tolerance) return '3:2';
  return 'other';
}

/**
 * ATTRIBÚTUM KONFIDENCIA TESZT - Attribútum alapú konfidencia ellenőrzése
 */
export function testAttributeConfidence() {
  console.log('🧪 Attribútum Konfidencia Teszt...');
  
  const testCases = [
    {
      name: 'Nagy kép (600x400)',
      attributes: { width: '600', height: '400', type: 'image/jpeg' },
      baseConfidence: 0.8
    },
    {
      name: 'Közepes kép (300x200)',
      attributes: { width: '300', height: '200', type: 'image/png' },
      baseConfidence: 0.7
    },
    {
      name: 'Kicsi kép (50x50)',
      attributes: { width: '50', height: '50', type: 'image/gif' },
      baseConfidence: 0.6
    },
    {
      name: 'WebP formátum',
      attributes: { width: '800', height: '600', type: 'image/webp' },
      baseConfidence: 0.8
    },
    {
      name: 'Nincs attribútum',
      attributes: undefined,
      baseConfidence: 0.5
    }
  ];
  
  testCases.forEach(testCase => {
    const adjustedConfidence = calculateAttributeBasedConfidence(
      testCase.baseConfidence, 
      testCase.attributes
    );
    
    console.log(`${testCase.name}:`);
    console.log(`  Alap konfidencia: ${testCase.baseConfidence}`);
    console.log(`  Attribútumok: ${JSON.stringify(testCase.attributes)}`);
    console.log(`  Módosított konfidencia: ${adjustedConfidence.toFixed(3)}`);
    console.log(`  Növekedés: ${((adjustedConfidence - testCase.baseConfidence) * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return true;
} 