// ========================================
// 🎥 VIDEO NEWS API ROUTE
// ========================================
// Ez a route CSAK videó híreket ad vissza!
// NEM keverjük a sima hírekkel!

import express from 'express';
// ========================================
// 🎥 VIDEO AGGREGATOR IMPORT - JAVÍTOTT ÚTVONAL!
// ========================================
import { videoAggregator, getAllChannelConfigs, getChannelConfigsByCountry } from './videoAggregator';
import { videoData } from '../../videoData/videoData';

const router = express.Router();

// ========================================
// 🎥 DEBUG ENDPOINT - ÚJ!
// ========================================
// GET /api/video/debug
// Visszaadja a konfigurált országokat és csatornákat
router.get('/debug', (req, res) => {
  try {
    // console.log('[Video API] 🐛 Debug kérés érkezett');

    const availableCountries: { [continent: string]: string[] } = {};
    const countryChannels: { [country: string]: any[] } = {};

    for (const [continent, countries] of Object.entries(videoData)) {
      if (typeof countries === 'object' && countries !== null) {
        availableCountries[continent] = [];
        for (const [countryKey, channels] of Object.entries(countries)) {
          if (Array.isArray(channels) && channels.length > 0) {
            const countryName = countryKey.replace(/\s*\(.*\)$/, '').trim();
            availableCountries[continent].push(countryName);
            countryChannels[countryName] = channels.map((ch: any) => ({
              title: ch.title,
              channelId: ch.channelId,
              language: ch.language,
              category: ch.category
            }));
          }
        }
      }
    }

    res.json({
      success: true,
      availableCountries,
      countryChannels,
      totalCountries: Object.keys(countryChannels).length,
      totalChannels: Object.values(countryChannels).reduce((sum, channels) => sum + channels.length, 0)
    });

  } catch (err) {
    // console.error('[Video API] 🐛 Hiba a debug adatok lekérésekor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch debug info',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// ========================================
// 🎥 VIDEO NEWS ENDPOINT
// ========================================
// GET /api/video/news
// Visszaadja az összes YouTube videó hírt
router.get('/news', async (req, res) => {
  try {
    // console.log('[Video API] 🎥 Video news kérés érkezett');
    // console.log('[Video API] Query paraméterek:', req.query);

    const country = req.query.country as string | undefined;
    if (!country) {
      // console.error('[Video API] ❌ Hiányzó country paraméter');
      return res.status(400).json({
        success: false,
        error: 'Country parameter is required',
        message: 'A country query paraméter kötelező ehhez a végponthoz!',
        availableCountries: ['Hungary', 'Germany', 'United Kingdom', 'United States'],
        example: '/api/video/news?country=Hungary'
      });
    }

    const maxVideos = parseInt(req.query.maxVideos as string) || 100;
    const maxAgeDays = parseInt(req.query.maxAgeDays as string) || 90;

    // console.log(`[Video API] 🎥 Konfiguráció: maxVideos=${maxVideos}, maxAgeDays=${maxAgeDays}`);

    let channelConfigs = getChannelConfigsByCountry(country, maxVideos, maxAgeDays);

    // console.log('[Video API] country param:', country);
    // console.log('[Video API] Lekért channelConfigs:', channelConfigs.map(c => ({ name: c.channelName, id: c.channelId, maxVideos: c.maxVideos, maxAgeDays: c.maxAgeDays })));

    if (channelConfigs.length === 0) {
      // console.warn(`[Video API] ⚠️ Nincsenek videó csatornák konfigurálva a(z) "${country}" országhoz`);
      return res.status(404).json({
        success: false,
        error: 'No video channels configured for this country',
        message: `Nincsenek videó csatornák konfigurálva a(z) "${country}" országhoz`,
        requestedCountry: country,
        availableCountries: ['Hungary', 'Germany', 'United Kingdom', 'United States']
      });
    }

    const videos = await videoAggregator.fetchMultipleChannels(channelConfigs);

    const allowedChannelIds = channelConfigs.map(c => c.channelId);
    const allVideosDebug = videos.map(v => ({ channelId: v.channelId, channelName: v.channelName, title: v.title, published: v.published }));
    const filteredVideos = videos.filter(video => allowedChannelIds.includes(video.channelId));
    const removed = videos.filter(video => !allowedChannelIds.includes(video.channelId));

    if (filteredVideos.length > 0) {
      // console.log('[DEBUG] Első video objektum:', filteredVideos[0]);
    } else {
      // console.log('[DEBUG] Nincs video objektum a filteredVideos-ban');
    }

    // console.log(`[Video API] ✅ ${filteredVideos.length} videó sikeresen lekérdezve a(z) "${country}" országból (${maxAgeDays} napos időkorlát, max ${maxVideos} videó/csatorna)`);

    res.json({
      success: true,
      count: filteredVideos.length,
      videos: filteredVideos,
      config: {
        country,
        maxVideos,
        maxAgeDays,
        totalChannels: channelConfigs.length
      },
      debug: {
        countryParam: country,
        channelConfigs: channelConfigs.map(c => ({ name: c.channelName, id: c.channelId, maxVideos: c.maxVideos, maxAgeDays: c.maxAgeDays })),
        allowedChannelIds,
        allVideos: allVideosDebug,
        removedVideos: removed.map(v => ({ channelId: v.channelId, channelName: v.channelName, title: v.title }))
      }
    });

  } catch (err) {
    // console.error('[Video API] 🎥 Hiba a videó hírek lekérésekor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video news',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export default router;
