import { NewsItem } from '../types';

// ...existing code...

export const compareImageData = (
  searchResults: NewsItem[],
  normalResults: NewsItem[],
  context: string = 'comparison'
) => {
  console.log(`\n🔬 === KÁDATSTRUKTÚRA ÖSSZEHASONLÍTÁS (${context}) ===`);
  
  const analyzeImageProps = (items: NewsItem[], label: string) => {
    const sample = items.slice(0, 5);
    const analysis = {
      total: items.length,
      withImageUrl: items.filter(item => !!item.imageUrl).length,
      withImageSrc: items.filter(item => !!(item as any).imageSrc).length,
      sampleStructures: sample.map(item => ({
        id: item.id,
        keys: Object.keys(item),
        hasImageUrl: !!item.imageUrl,
        hasImageSrc: !!(item as any).imageSrc,
        imageUrl: item.imageUrl,
        imageSrc: (item as any).imageSrc
      }))
    };
    
    console.log(`[${label}] Elemzés:`, analysis);
    return analysis;
  };
  
  const searchAnalysis = analyzeImageProps(searchResults, 'SEARCH RESULTS');
  const normalAnalysis = analyzeImageProps(normalResults, 'NORMAL RESULTS');
  
  const differences = {
    imageUrlRatio: {
      search: searchAnalysis.withImageUrl / searchAnalysis.total,
      normal: normalAnalysis.withImageUrl / normalAnalysis.total
    },
    imageSrcRatio: {
      search: searchAnalysis.withImageSrc / searchAnalysis.total,
      normal: normalAnalysis.withImageSrc / normalAnalysis.total
    }
  };
  
  console.log('🚨 KRITIKUS KÜLÖNBSÉGEK:', differences);
  
  if (differences.imageUrlRatio.search < differences.imageUrlRatio.normal) {
    console.warn('⚠️ KERESÉSI EREDMÉNYEKNÉL KEVESEBB KÉP!');
  }
  
  return { searchAnalysis, normalAnalysis, differences };
};
// ...existing code...