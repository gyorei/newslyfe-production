/**
 * TabNotifications rendszer konstansai
 *
 * Egyszerűsített verzió - csak Badge konstansok
 */

// UI konstansok
export const NOTIFICATION_CONSTANTS = {
  // Badge beállítások
  MAX_BADGE_COUNT: 99,
  BADGE_ANIMATION_DURATION: 2000, // ms

  // Debug mód
  DEBUG_MODE: true, // később environment variable lesz
} as const;

// CSS class nevek
export const CSS_CLASSES = {
  BADGE: 'notificationBadge',
  BADGE_ANIMATED: 'badgeAnimation',
} as const;

// Mock adatok kategóriái (teszteléshez)
export const MOCK_CATEGORIES = {
  HUNGARY: 'hungary',
  BELGIUM: 'belgium',
  FILTERED: 'filtered',
  DEFAULT: 'default',
} as const;

// Típus exportok a konstansokhoz
export type NotificationConstant = typeof NOTIFICATION_CONSTANTS;
export type CSSClassName = typeof CSS_CLASSES;
export type MockCategory = (typeof MOCK_CATEGORIES)[keyof typeof MOCK_CATEGORIES];
