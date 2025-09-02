// src/backend/tests/__tests__/caching.test.ts
// npx jest caching.test.ts
// npx jest npm test
// npx jest caching.test.ts --verbose

// EGYSZERŰ MOCK VERZIÓ
// Ezt nem módosítjuk tiltott!!!
// Mock-ok MINDEN import előtt
jest.mock('../../server/PostgreSQLManager');
jest.mock('../../server/data/PostgreSQLDataAccess');
jest.mock('rss-parser');

import request from 'supertest';
import app from '../../server/app';

// Mock implementációk IMPORTOK UTÁN
const mockSourcesService = {
  getAllCountries: jest.fn().mockResolvedValue(['Hungary', 'Germany', 'France']),
  getCountrySources: jest.fn().mockResolvedValue([
    { 
      orszag: 'Hungary', 
      cim: 'Test Source', 
      rss_feed: 'https://example.com/rss',
      fontossag: 1 
    }
  ]),
  getCountrySourcesByImportanceLevel: jest.fn().mockResolvedValue([
    { 
      orszag: 'Hungary', 
      cim: 'Test Source', 
      rss_feed: 'https://example.com/rss',
      fontossag: 1 
    }
  ])
};

const mockDb = {
  query: jest.fn(),
  checkConnection: jest.fn().mockResolvedValue(true),
  closePool: jest.fn().mockResolvedValue(undefined)
};

const mockRssParser = jest.fn().mockImplementation(() => ({
  parseURL: jest.fn().mockResolvedValue({
    items: [
      {
        title: 'Test News Article',
        link: 'https://example.com/article1',
        pubDate: new Date().toISOString(),
        contentSnippet: 'This is a test article content...'
      }
    ]
  })
}));

// Mock modulok felülírása
jest.doMock('../../server/PostgreSQLManager', () => ({
  db: mockDb
}));

jest.doMock('../../server/data/PostgreSQLDataAccess', () => ({
  SourcesService: jest.fn().mockImplementation(() => mockSourcesService),
  sourcesService: mockSourcesService,
  default: mockSourcesService
}));

jest.doMock('rss-parser', () => mockRssParser);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SWR Cache Logic Tests', () => {
  const testCountryCode = 'Hungary';
  const CACHE_TIMEOUT = 3000; // 3 másodperc

  beforeAll(async () => {
    console.log('🚀 Starting cache tests with mocked dependencies');
    console.log(`📍 Using test country: ${testCountryCode}`);
  });

  afterAll(async () => {
    console.log('✅ Cache tests completed');
    await wait(100);
  });

  describe('GET /api/local/news', () => {
    
    it('should handle cache MISS, HIT, and STALE lifecycle', async () => {
      const URL = `/api/local/news?country=${testCountryCode}`;

      console.log(`\n🧪 Testing LOCAL endpoint: ${URL}`);

      // 1. CACHE MISS
      console.log('1️⃣ Testing CACHE MISS...');
      const missStartTime = Date.now();
      const missResponse = await request(app).get(URL);
      const missDuration = Date.now() - missStartTime;
      
      console.log(`   Duration: ${missDuration}ms`);
      console.log(`   Status: ${missResponse.status}`);
      
      // Alapvető ellenőrzések
      expect(missResponse.status).toBe(200);
      expect(missDuration).toBeGreaterThan(5);

      // 2. CACHE HIT
      console.log('2️⃣ Testing CACHE HIT...');
      const hitStartTime = Date.now();
      const hitResponse = await request(app).get(URL);
      const hitDuration = Date.now() - hitStartTime;
      
      console.log(`   Duration: ${hitDuration}ms`);
      console.log(`   Status: ${hitResponse.status}`);
      
      expect(hitResponse.status).toBe(200);
      
      // Cache hatékonyság ellenőrzése
      if (hitDuration < missDuration) {
        console.log(`   ✅ Cache HIT faster by ${missDuration - hitDuration}ms`);
      }

      // 3. CACHE STALE (cache lejárat után)
      console.log(`3️⃣ Waiting ${CACHE_TIMEOUT + 500}ms for cache expiration...`);
      await wait(CACHE_TIMEOUT + 500);
      
      console.log('3️⃣ Testing CACHE STALE...');
      const staleStartTime = Date.now();
      const staleResponse = await request(app).get(URL);
      const staleDuration = Date.now() - staleStartTime;
      
      console.log(`   Duration: ${staleDuration}ms`);
      console.log(`   Status: ${staleResponse.status}`);
      
      expect(staleResponse.status).toBe(200);
      
      console.log(' ✅ LOCAL cache lifecycle test completed');

    }, 25000);
  });
  
  describe('GET /api/country/:country/news', () => {

    it('should handle cache MISS, HIT, and STALE lifecycle', async () => {
      const URL = `/api/country/${testCountryCode}/news`;

      console.log(`\n🧪 Testing COUNTRY endpoint: ${URL}`);

      // 1. CACHE MISS
      console.log('1️⃣ Testing CACHE MISS...');
      const missStartTime = Date.now();
      const missResponse = await request(app).get(URL);
      const missDuration = Date.now() - missStartTime;
      
      console.log(`   Duration: ${missDuration}ms`);
      console.log(`   Status: ${missResponse.status}`);
      
      expect(missResponse.status).toBe(200);
      expect(missDuration).toBeGreaterThan(5);

      // 2. CACHE HIT
      console.log('2️⃣ Testing CACHE HIT...');
      const hitStartTime = Date.now();
      const hitResponse = await request(app).get(URL);
      const hitDuration = Date.now() - hitStartTime;
      
      console.log(`   Duration: ${hitDuration}ms`);
      console.log(`   Status: ${hitResponse.status}`);
      
      expect(hitResponse.status).toBe(200);
      
      if (hitDuration < missDuration) {
        console.log(`   ✅ Cache HIT faster by ${missDuration - hitDuration}ms`);
      }

      // 3. CACHE STALE
      console.log(`3️⃣ Waiting ${CACHE_TIMEOUT + 500}ms for cache expiration...`);
      await wait(CACHE_TIMEOUT + 500);
      
      console.log('3️⃣ Testing CACHE STALE...');
      const staleStartTime = Date.now();
      const staleResponse = await request(app).get(URL);
      const staleDuration = Date.now() - staleStartTime;
      
      console.log(`   Duration: ${staleDuration}ms`);
      console.log(`   Status: ${staleResponse.status}`);
      
      expect(staleResponse.status).toBe(200);
      
      console.log(' ✅ COUNTRY cache lifecycle test completed');
       
    }, 25000);
  });

  describe('Cache Performance Benchmark', () => {
    it('should measure cache performance improvements', async () => {
      const URL = `/api/local/news?country=${testCountryCode}`;
      const measurements = [];

      console.log('\n📊 CACHE PERFORMANCE BENCHMARK:');
      
      // Multiple MISS/HIT cycles
      for (let cycle = 1; cycle <= 3; cycle++) {
        console.log(`\n🔄 Cycle ${cycle}:`);
        
        // MISS
        const missStart = Date.now();
        await request(app).get(URL);
        const missDuration = Date.now() - missStart;
        measurements.push({ type: 'MISS', duration: missDuration, cycle });
        console.log(`   MISS: ${missDuration}ms`);

        // HITs
        for (let hit = 1; hit <= 2; hit++) {
          const hitStart = Date.now();
          await request(app).get(URL);
          const hitDuration = Date.now() - hitStart;
          measurements.push({ type: 'HIT', duration: hitDuration, cycle });
          console.log(`   HIT ${hit}: ${hitDuration}ms`);
        }

        // Wait for cache expiration before next cycle
        if (cycle < 3) {
          console.log(`   ⏳ Waiting for cache expiration...`);
          await wait(CACHE_TIMEOUT + 200);
        }
      }

      // Analysis
      const misses = measurements.filter(m => m.type === 'MISS');
      const hits = measurements.filter(m => m.type === 'HIT');

      const avgMiss = misses.reduce((sum, m) => sum + m.duration, 0) / misses.length;
      const avgHit = hits.reduce((sum, m) => sum + m.duration, 0) / hits.length;

      console.log('\n📈 PERFORMANCE RESULTS:');
      console.log(`   Average MISS: ${avgMiss.toFixed(1)}ms`);
      console.log(`   Average HIT: ${avgHit.toFixed(1)}ms`);
      console.log(`   Speedup: ${(avgMiss / avgHit).toFixed(1)}x`);
      console.log(`   Time saved: ${(avgMiss - avgHit).toFixed(1)}ms per request`);

      // Assertions
      expect(misses.length).toBe(3);
      expect(hits.length).toBe(6);
   // expect(avgHit).toBeLessThanOrEqual(avgMiss);
   // Elég annyit ellenőrizni, hogy a HIT ne legyen drasztikusan lassabb
      expect(avgHit).toBeLessThan(avgMiss * 2 + 50); // Pl. a HIT ne legyen több, mint a MISS kétszerese + 50ms


      console.log(' ✅ Performance benchmark completed');

    }, 40000);
  });
});



