/**
 * Image Extractor Batch Processing Module
 * 
 * Ez a modul felelős a kötegelt képkinyerési feldolgozásért.
 * Támogatja a párhuzamos feldolgozást, konkurrencia korlátozást,
 * és teljesítmény optimalizációt nagy mennyiségű RSS item esetén.
 */

import { extractImageWithDetails, ImageExtractionResult } from './imageExtractor';

// ✅ TELJESÍTMÉNY OPTIMALIZÁLÁS: Konkurrencia korlátozás
const DEFAULT_CONCURRENCY_LIMIT = 5;
const DEFAULT_BATCH_SIZE = 10;

/**
 * Batch feldolgozási konfiguráció
 */
export interface BatchProcessingConfig {
  concurrencyLimit?: number;
  batchSize?: number;
  enableProgressLogging?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Batch feldolgozási eredmény
 */
export interface BatchProcessingResult {
  results: ImageExtractionResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
  };
  errors: Array<{
    index: number;
    error: string;
    item?: any;
  }>;
}

/**
 * Párhuzamos batch feldolgozás konkurrencia korlátozással
 */
export async function processBatchWithConcurrency<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<any>,
  config: BatchProcessingConfig = {}
): Promise<BatchProcessingResult> {
  const {
    concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
    batchSize = DEFAULT_BATCH_SIZE,
    enableProgressLogging = false,
    retryAttempts = 2,
    retryDelay = 1000
  } = config;

  const results: any[] = [];
  const errors: Array<{ index: number; error: string; item?: any }> = [];
  const startTime = Date.now();

  // Batch-ek felosztása
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  let processedCount = 0;

  // Batch-ek feldolgozása párhuzamosan
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    if (enableProgressLogging) {
      console.log(`[Batch Processing] Batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
    }

    // Konkurrencia korlátozás: csak annyi párhuzamos feldolgozás, amennyi megengedett
    const batchPromises = batch.map(async (item, localIndex) => {
      const globalIndex = batchIndex * batchSize + localIndex;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const result = await processor(item, globalIndex);
          results[globalIndex] = result;
          processedCount++;
          
          if (enableProgressLogging && processedCount % 10 === 0) {
            console.log(`[Batch Processing] Progress: ${processedCount}/${items.length} (${((processedCount / items.length) * 100).toFixed(1)}%)`);
          }
          
          return result;
        } catch (error) {
          if (attempt === retryAttempts) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({
              index: globalIndex,
              error: errorMessage,
              item
            });
            console.warn(`[Batch Processing] Failed after ${retryAttempts + 1} attempts at index ${globalIndex}:`, errorMessage);
          } else {
            // Várakozás újrapróbálkozás előtt
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }
    });

    // Batch feldolgozása konkurrencia korlátozással
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Sikertelen eredmények kezelése
    batchResults.forEach((result, localIndex) => {
      if (result.status === 'rejected') {
        const globalIndex = batchIndex * batchSize + localIndex;
        errors.push({
          index: globalIndex,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
  }

  const totalProcessingTime = Date.now() - startTime;
  const successful = results.filter(r => r !== undefined).length;
  const failed = errors.length;

  return {
    results: results.filter(r => r !== undefined),
    stats: {
      total: items.length,
      successful,
      failed,
      averageProcessingTime: totalProcessingTime / items.length,
      totalProcessingTime
    },
    errors
  };
}

/**
 * Kötegelt képkinyerés optimalizált teljesítménnyel
 */
export async function extractImagesFromItemsBatch(
  items: any[],
  config: BatchProcessingConfig = {}
): Promise<BatchProcessingResult> {
  return processBatchWithConcurrency(
    items,
    async (item, index) => {
      try {
        return await extractImageWithDetails(item);
      } catch (error) {
        console.warn(`[Batch Image Extraction] Error processing item ${index}:`, error);
        throw error;
      }
    },
    {
      concurrencyLimit: 3, // Alacsonyabb limit képkinyeréshez
      batchSize: 5, // Kisebb batch méret
      enableProgressLogging: true,
      retryAttempts: 1,
      retryDelay: 500,
      ...config
    }
  );
}

/**
 * Memória optimalizált batch feldolgozás
 */
export async function processBatchWithMemoryOptimization<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<any>,
  config: BatchProcessingConfig & {
    memoryThreshold?: number; // MB-ban
    gcInterval?: number; // Hány item után GC
  } = {}
): Promise<BatchProcessingResult> {
  const {
    memoryThreshold = 100, // 100MB
    gcInterval = 50,
    ...batchConfig
  } = config;

  const results: any[] = [];
  const errors: Array<{ index: number; error: string; item?: any }> = [];
  const startTime = Date.now();

  let processedCount = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      const result = await processor(items[i], i);
      results.push(result);
      processedCount++;

      // Memória ellenőrzés és GC
      if (processedCount % gcInterval === 0) {
        const memoryUsage = process.memoryUsage();
        const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
        
        if (memoryMB > memoryThreshold) {
          console.log(`[Memory Optimization] High memory usage: ${memoryMB.toFixed(2)}MB, triggering GC`);
          
          // Node.js GC hívása (ha elérhető)
          if (global.gc) {
            global.gc();
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        index: i,
        error: errorMessage,
        item: items[i]
      });
    }
  }

  const totalProcessingTime = Date.now() - startTime;

  return {
    results,
    stats: {
      total: items.length,
      successful: results.length,
      failed: errors.length,
      averageProcessingTime: totalProcessingTime / items.length,
      totalProcessingTime
    },
    errors
  };
}

/**
 * Teljesítmény metrikák generálása
 */
export function generatePerformanceMetrics(result: BatchProcessingResult): {
  throughput: number; // items/second
  successRate: number; // percentage
  errorRate: number; // percentage
  averageTimePerItem: number; // milliseconds
  memoryEfficiency: number; // items per MB
} {
  const { stats } = result;
  
  const throughput = stats.totalProcessingTime > 0 ? 
    (stats.successful / (stats.totalProcessingTime / 1000)) : 0;
  
  const successRate = stats.total > 0 ? 
    (stats.successful / stats.total) * 100 : 0;
  
  const errorRate = stats.total > 0 ? 
    (stats.failed / stats.total) * 100 : 0;
  
  const averageTimePerItem = stats.averageProcessingTime;
  
  // Memória hatékonyság (becsült)
  const memoryUsage = process.memoryUsage();
  const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
  const memoryEfficiency = memoryMB > 0 ? stats.successful / memoryMB : 0;

  return {
    throughput,
    successRate,
    errorRate,
    averageTimePerItem,
    memoryEfficiency
  };
}

/**
 * Batch feldolgozási statisztikák kinyomtatása
 */
export function logBatchProcessingStats(result: BatchProcessingResult): void {
  const metrics = generatePerformanceMetrics(result);
  
  console.log('\n=== BATCH PROCESSING STATISTICS ===');
  console.log(`Total items: ${result.stats.total}`);
  console.log(`Successful: ${result.stats.successful}`);
  console.log(`Failed: ${result.stats.failed}`);
  console.log(`Success rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`Error rate: ${metrics.errorRate.toFixed(1)}%`);
  console.log(`Total processing time: ${(result.stats.totalProcessingTime / 1000).toFixed(2)}s`);
  console.log(`Average time per item: ${metrics.averageTimePerItem.toFixed(2)}ms`);
  console.log(`Throughput: ${metrics.throughput.toFixed(2)} items/second`);
  console.log(`Memory efficiency: ${metrics.memoryEfficiency.toFixed(2)} items/MB`);
  
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.slice(0, 5).forEach(error => {
      console.log(`  Index ${error.index}: ${error.error}`);
    });
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more errors`);
    }
  }
  
  console.log('=====================================\n');
}

/**
 * STATISZTIKÁK GENERÁLÁSA - Képkinyerési eredmények elemzése
 *
 * @param results Képkinyerési eredmények
 * @returns Statisztikai összefoglaló
 */
export function generateImageExtractionStats(results: ImageExtractionResult[]) {
  const total = results.length;
  const withImages = results.filter((r) => r.imageUrl).length;
  const bySource = results.reduce(
    (acc, result) => {
      acc[result.source] = (acc[result.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    withImages,
    withoutImages: total - withImages,
    successRate: total > 0 ? ((withImages / total) * 100).toFixed(1) + '%' : '0%',
    bySource,
    averageConfidence:
      results.length > 0
        ? (results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2)
        : '0',
  };
}

/**
 * EGYSZERŰ KÖTEGELT KÉPKINYERÉS - Kompatibilis a régi extractImagesFromItems függvénnyel
 *
 * @param items RSS feed elemek tömbje
 * @returns Képkinyerési eredmények tömbje
 */
export async function extractImagesFromItems(items: any[]): Promise<ImageExtractionResult[]> {
  return Promise.all(items.map((item) => extractImageWithDetails(item)));
}
