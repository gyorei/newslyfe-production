import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { videoData } from '../../videoData/videoData.js';

/**
 * YouTube RSS Entry Interface
 */
interface YouTubeRSSEntry {
  'yt:videoId'?: string;
  title?: string;
  link?: any; // Can be object or array
  published?: string;
  updated?: string;
  author?: any; // Can be object or string
  'media:group'?: {
    'media:title'?: string;
    'media:description'?: string;
    'media:thumbnail'?: any; // Can be object or array
    'media:community'?: {
      'media:statistics'?: {
        '@_views'?: string;
      };
    };
  };
}

/**
 * YouTube Video Aggregator
 * Fetches and parses YouTube RSS feeds for news videos
 */
export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  description: string;
  published: string;
  views?: number;
  author: string;
  type: 'youtube';
  channelId: string;
  channelName: string;
}

export interface YouTubeFeedConfig {
  channelId: string;
  channelName: string;
  maxVideos?: number;
  maxAgeDays?: number; // ÚJ: időkorlát napokban
}

// --- ÚJ: IDŐKORLÁT SEGÉDFÜGGVÉNYEK ---
/**
 * Ellenőrzi, hogy a videó a megadott időkorláton belül van-e
 */
function isVideoWithinTimeLimit(publishedDate: string, maxAgeDays: number = 90): boolean {
  try {
    const videoDate = new Date(publishedDate);
    const now = new Date();
    const timeLimit = new Date(now.getTime() - (maxAgeDays * 24 * 60 * 60 * 1000));
    
    return videoDate >= timeLimit;
  } catch (error) {
    console.warn('[VideoAggregator] Hiba a dátum ellenőrzésekor:', error);
    return true; // Ha hiba van, megjelenítjük a videót
  }
}

/**
 * Szűri a videókat időkorlát alapján
 */
function filterVideosByTimeLimit(videos: YouTubeVideo[], maxAgeDays: number = 90): YouTubeVideo[] {
  return videos.filter(video => isVideoWithinTimeLimit(video.published, maxAgeDays));
}

// --- ÚJ: videoData.jsonc alapú függvények ---
export function getAllChannelConfigs(maxVideos: number = 100, maxAgeDays: number = 30): YouTubeFeedConfig[] {
  const configs: YouTubeFeedConfig[] = [];
  for (const continent of Object.values(videoData)) {
    if (typeof continent !== 'object' || !continent) continue;
    for (const countryArr of Object.values(continent)) {
      if (!Array.isArray(countryArr)) continue;
      for (const channel of countryArr) {
        // Skip disabled channels
        if (channel.enabled === false) {
          console.log(`[VideoAggregator] Skipping disabled channel: ${channel.title}`);
          continue;
        }
        configs.push({
          channelId: channel.channelId,
          channelName: channel.title,
          maxVideos,
          maxAgeDays
        });
      }
    }
  }
  return configs;
}

export function getChannelConfigsByCountry(countryName: string, maxVideos: number = 100, maxAgeDays: number = 30): YouTubeFeedConfig[] {
  const configs: YouTubeFeedConfig[] = [];
  const normalizedCountry = countryName.trim().toLowerCase();
  for (const continent of Object.values(videoData)) {
    if (typeof continent !== 'object' || !continent) continue;
    for (const [countryKey, countryArr] of Object.entries(continent)) {
      if (!Array.isArray(countryArr)) continue;
      // Zárójelet eltávolítjuk a countryKey végéről (pl. "Hungary (HU)" -> "Hungary")
      const normalizedKey = countryKey.replace(/\s*\(.*\)$/, '').trim().toLowerCase();
      if (
        normalizedKey === normalizedCountry ||
        (countryArr[0] && countryArr[0].country && countryArr[0].country.trim().toLowerCase() === normalizedCountry)
      ) {
        for (const channel of countryArr) {
          // Skip disabled channels
          if (channel.enabled === false) {
            console.log(`[VideoAggregator] Skipping disabled channel: ${channel.title}`);
            continue;
          }
          configs.push({
            channelId: channel.channelId,
            channelName: channel.title,
            maxVideos,
            maxAgeDays
          });
        }
      }
    }
  }
  return configs;
}

export class VideoAggregator {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '_text',
      parseAttributeValue: true,
      parseTagValue: false,
    });
  }

  /**
   * Fetch YouTube RSS feed for a specific channel
   */
  async fetchYouTubeFeed(config: YouTubeFeedConfig): Promise<YouTubeVideo[]> {
    // console.log('*** VIDEOAGGREGATOR FUT! ***'); // DEBUG: Egyedi log a teszthez
    try {
      const { channelId, channelName, maxVideos = 100, maxAgeDays = 30 } = config;
      // Hivatalos YouTube RSS feed URL formátum
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      
      // console.log(`[VideoAggregator] Fetching YouTube feed for ${channelName}: ${url}`);
      // console.log(`[VideoAggregator] Config: maxVideos=${maxVideos}, maxAgeDays=${maxAgeDays}`);
      
      const response = await axios.get(url, {
        timeout: 15000, // Növeljük a timeout-ot 15 másodpercre
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
          'Accept': 'application/xml, text/xml, */*',
        },
      });

      if (response.status !== 200) {
        console.error(`[VideoAggregator] HTTP ${response.status} hiba a(z) ${channelName} csatornához`);
        throw new Error(`HTTP ${response.status}: Failed to fetch YouTube feed for ${channelName}`);
      }

      if (!response.data || typeof response.data !== 'string') {
        console.error(`[VideoAggregator] Érvénytelen válasz a(z) ${channelName} csatornához`);
        throw new Error(`Invalid response format for ${channelName}`);
      }

      const videos = this.parseYouTubeRSS(response.data, channelId, channelName);
      // console.log(`[VideoAggregator] ${videos.length} videó parse-olva a(z) ${channelName} csatornából`);
      
      // Először időkorlát szerint szűrjük
      const timeFilteredVideos = filterVideosByTimeLimit(videos, maxAgeDays);
      // console.log(`[VideoAggregator] ${timeFilteredVideos.length} videó maradt ${maxAgeDays} napos időkorlát után`);
      
      // Majd limitáljuk a számukat
      const limitedVideos = timeFilteredVideos.slice(0, maxVideos);
      
      // console.log(`[VideoAggregator] ✅ ${limitedVideos.length} videó sikeresen feldolgozva a(z) ${channelName} csatornából (${maxAgeDays} napos időkorlát, max ${maxVideos} videó)`);
      
      // DEBUG: Részletes videó információk
      if (limitedVideos.length > 0) {
        // console.log(`[VideoAggregator] 📺 ${channelName} videók:`, limitedVideos.map(v => ({
        //   title: v.title.substring(0, 50) + '...',
        //   published: v.published,
        //   channelId: v.channelId
        // })));
      }
      
      return limitedVideos;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error(`[VideoAggregator] ⏰ Timeout a(z) ${config.channelName} csatornához`);
        } else if (error.response?.status === 404) {
          console.error(`[VideoAggregator] ❌ 404 - A(z) ${config.channelName} csatorna nem található`);
        } else if (error.response?.status === 403) {
          console.error(`[VideoAggregator] 🚫 403 - Hozzáférés megtagadva a(z) ${config.channelName} csatornához`);
        } else {
          console.error(`[VideoAggregator] 🌐 Hálózati hiba a(z) ${config.channelName} csatornához:`, error.message);
        }
      } else {
        console.error(`[VideoAggregator] ❌ Ismeretlen hiba a(z) ${config.channelName} csatornához:`, error);
      }
      return [];
    }
  }

  /**
   * Parse YouTube RSS XML content
   */
  private parseYouTubeRSS(xmlContent: string, channelId: string, channelName: string): YouTubeVideo[] {
    try {
      const parsed = this.parser.parse(xmlContent);
      const feed = parsed.feed;
      
      if (!feed || !feed.entry) {
        console.warn(`[VideoAggregator] No entries found in YouTube feed for ${channelName}`);
        return [];
      }

      // Ensure entries is always an array
      const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      
      return entries
        .filter((entry: YouTubeRSSEntry) => this.isValidVideoEntry(entry))
        .map((entry: YouTubeRSSEntry) => this.parseVideoEntry(entry, channelId, channelName))
        .filter((video: YouTubeVideo | null) => video !== null) as YouTubeVideo[];
        
    } catch (error) {
      console.error(`[VideoAggregator] Error parsing YouTube RSS for ${channelName}:`, error);
      return [];
    }
  }

  /**
   * Check if entry is a valid video entry
   */
  private isValidVideoEntry(entry: YouTubeRSSEntry): boolean {
    return entry && 
           entry['yt:videoId'] && 
           entry.title && 
           entry.link;
  }

  /**
   * Parse individual video entry
   */
  private parseVideoEntry(entry: YouTubeRSSEntry, channelId: string, channelName: string): YouTubeVideo | null {
    try {
      const videoId = entry['yt:videoId'];
      if (!videoId) return null;
      
      // console.log(`[DEBUG] Parsing video from channel: ${channelName} → ID: ${videoId}`);
      
      const title = this.extractTitle(entry);
      const link = this.extractLink(entry);
      const thumbnail = this.getThumbnailUrl(videoId, entry);
      const description = this.extractDescription(entry);
      const published = entry.published || entry.updated || new Date().toISOString();
      const views = this.extractViews(entry);
      const author = this.extractAuthor(entry, channelName);

      return {
        id: `yt:${videoId}`,
        videoId,
        title,
        link,
        thumbnail,
        description,
        published,
        views,
        author,
        type: 'youtube',
        channelId,
        channelName,
      };
      
    } catch (error) {
      console.error(`[VideoAggregator] Error parsing video entry:`, error);
      return null;
    }
  }

  /**
   * Extract video title
   */
  private extractTitle(entry: YouTubeRSSEntry): string {
    // Try media:title first, then regular title
    const mediaTitle = entry['media:group']?.['media:title'];
    const regularTitle = entry.title;
    
    return mediaTitle || regularTitle || 'Untitled Video';
  }

  /**
   * Extract video link
   */
  private extractLink(entry: YouTubeRSSEntry): string {
    if (entry.link && Array.isArray(entry.link)) {
      // Find the alternate link
      const alternateLink = entry.link.find((link: any) => link['@_rel'] === 'alternate');
      return alternateLink?.['@_href'] || '';
    } else if (entry.link && typeof entry.link === 'object') {
      return entry.link['@_href'] || '';
    }
    return '';
  }

  /**
   * Get thumbnail URL with fallback
   */
  private getThumbnailUrl(videoId: string, entry: YouTubeRSSEntry): string {
    // Try to get thumbnail from media:group
    const mediaGroup = entry['media:group'];
    if (mediaGroup && mediaGroup['media:thumbnail']) {
      const thumbnails = Array.isArray(mediaGroup['media:thumbnail']) 
        ? mediaGroup['media:thumbnail'] 
        : [mediaGroup['media:thumbnail']];
      
      // Get the first available thumbnail
      const thumbnail = thumbnails.find((t: any) => t['@_url']);
      if (thumbnail && thumbnail['@_url']) {
        return thumbnail['@_url'];
      }
    }
    
    // Fallback to standard YouTube thumbnail
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  /**
   * Extract video description
   */
  private extractDescription(entry: YouTubeRSSEntry): string {
    const mediaGroup = entry['media:group'];
    if (mediaGroup && mediaGroup['media:description']) {
      return mediaGroup['media:description'] || '';
    }
    return '';
  }

  /**
   * Extract view count
   */
  private extractViews(entry: YouTubeRSSEntry): number | undefined {
    try {
      const mediaGroup = entry['media:group'];
      if (mediaGroup && mediaGroup['media:community'] && mediaGroup['media:community']['media:statistics']) {
        const views = mediaGroup['media:community']['media:statistics']['@_views'];
        return views ? parseInt(views, 10) : undefined;
      }
    } catch (error) {
      // Ignore view count parsing errors
    }
    return undefined;
  }

  /**
   * Extract author name
   */
  private extractAuthor(entry: YouTubeRSSEntry, defaultAuthor: string): string {
    if (entry.author) {
      if (typeof entry.author === 'object' && entry.author.name) {
        return entry.author.name;
      } else if (typeof entry.author === 'string') {
        return entry.author;
      }
    }
    return defaultAuthor;
  }

  /**
   * Fetch multiple YouTube channels with strict channelId filtering
   */
  async fetchMultipleChannels(configs: YouTubeFeedConfig[]): Promise<YouTubeVideo[]> {
    const allVideos: YouTubeVideo[] = [];
    // Gyűjtsük össze az engedélyezett csatorna ID-kat
    const allowedChannelIds = new Set(configs.map(config => config.channelId));
    
    // console.log(`[VideoAggregator] 🎥 ${configs.length} csatorna feldolgozása...`);
    // console.log(`[VideoAggregator] Engedélyezett channel ID-k:`, Array.from(allowedChannelIds));
    
    for (const config of configs) {
      try {
        // console.log(`[VideoAggregator] 🔍 Feldolgozás: ${config.channelName} (${config.channelId})`);
        const videos = await this.fetchYouTubeFeed(config);
        
        // DEBUG: Ellenőrizzük a channelId egyezést
        for (const video of videos) {
          if (!video.channelId || video.channelId !== config.channelId) {
            console.warn(`[FIGYELEM] Videó channelId mismatch!`, {
              channelName: config.channelName,
              expected: config.channelId,
              actual: video.channelId,
              videoTitle: video.title
            });
          }
        }
        
        // Szűrés: csak az engedélyezett csatornából származó videók
        const filteredVideos = videos.filter(video => allowedChannelIds.has(video.channelId));
        if (filteredVideos.length !== videos.length) {
          // console.log(`[VideoAggregator] ${filteredVideos.length} valid videos from ${config.channelName} after filtering`);
          // console.log(`[VideoAggregator] Removed ${videos.length - filteredVideos.length} foreign videos`);
        }
        allVideos.push(...filteredVideos);
      } catch (error) {
        console.error(`[VideoAggregator] Error fetching ${config.channelName}:`, error);
        // Continue with other channels
      }
    }
    
    // console.log(`[VideoAggregator] ✅ Összesen ${allVideos.length} videó összegyűjtve ${configs.length} csatornából`);
    
    // Sort by published date (newest first)
    return allVideos.sort((a, b) => 
      new Date(b.published).getTime() - new Date(a.published).getTime()
    );
  }
}

// Export singleton instance
export const videoAggregator = new VideoAggregator();
