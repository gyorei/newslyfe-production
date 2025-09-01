// src\components\Ad\analytics.ts

export function trackAdEvent(event: string, payload?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, payload || {});
  } else {
    // Fallback: log to console in dev
    // eslint-disable-next-line no-console
    console.log('[Analytics] (dev) event:', event, payload);
  }
} 