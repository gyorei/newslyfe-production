// src\components\Ad\adService.ts

// Singleton promise cache a betöltött script URL-ekhez
const scriptPromises: Map<string, Promise<void>> = new Map();

export function injectScript(src: string): Promise<void> {
  if (!scriptPromises.has(src)) {
    const promise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
    scriptPromises.set(src, promise);
  }
  return scriptPromises.get(src)!;
}
