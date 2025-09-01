// Ambient globális típusdeklaráció Google AdSense számára
declare global {
  interface Window {
    /** Adsbygoogle sorozat, amelybe az AdSense szkriptek push-olnak */
    adsbygoogle?: unknown[];
  }
}

export {};
