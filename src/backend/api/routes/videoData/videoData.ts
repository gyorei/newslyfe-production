// src/backend/api/routes/videoData/videoData.ts

// YouTube channel type definition
export interface VideoChannel {
  name: string; // Channel name
  youtubeUrl: string; // YouTube channel URL
  channelId: string; // YouTube channelId
  description: string; // Description
  category: string; // Main category/topic
  sections: string[]; // Content tags (if used)
}

// Country-wise channel list type definition
export interface CountryVideoChannels {
  country: string; // Country name
  countryCode: string; // Country code (e.g. HU, DE)
  language: string; // Language (e.g. en, de)
  channels: VideoChannel[]; // Array of channels
}

// --- ÚJ: videoData.jsonc betöltése ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'jsonc-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videoDataPath = path.join(__dirname, 'videoData.jsonc');
const videoDataRaw = fs.readFileSync(videoDataPath, 'utf-8');
const videoDataJsonc = parse(videoDataRaw);

// --- EZT EXPORTÁLD! ---
export const videoData = videoDataJsonc;

// --- RÉGI: TS alapú adatstruktúra (kikommentelve) ---
/*
export const videoChannelsByLetter: { [letter: string]: CountryVideoChannels[] } = {
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
  F: [],
  G: [],
  H: [],
  I: [],
  J: [],
  K: [],
  L: [],
  M: [],
  N: [],
  O: [],
  P: [],
  Q: [],
  R: [],
  S: [],
  T: [],
  U: [],
  V: [],
  W: [],
  X: [],
  Y: [],
  Z: []
};
*/

// --- ADAPTER: JSONC -> TS struktúra ---
export function getVideoChannelsByLetter() {
  const byLetter: { [letter: string]: any[] } = {};
  for (const continent of Object.values(videoDataJsonc)) {
    if (typeof continent !== 'object' || !continent) continue;
    for (const [countryKey, channelArr] of Object.entries(continent)) {
      if (!Array.isArray(channelArr) || channelArr.length === 0) continue;
      const match = countryKey.match(/^(.+?)\s*\((\w+)\)$/);
      const country = match ? match[1].trim() : countryKey;
      const countryCode = match ? match[2].trim() : '';
      const language = channelArr[0]?.language || '';
      const countryObj = {
        country,
        countryCode,
        language,
        channels: channelArr.map((ch: any) => ({
          name: ch.title,
          youtubeUrl: ch.youtubeUrl,
          channelId: ch.channelId,
          description: ch.description,
          category: ch.category,
          sections: ch.sections,
        })),
      };
      const letter = country[0].toUpperCase();
      if (!byLetter[letter]) byLetter[letter] = [];
      byLetter[letter].push(countryObj);
    }
  }
  return byLetter;
}