/// <reference types="vite/client" />

// Timer típusok kompatibilitás a Node.js és böngésző között
declare global {
  interface Window {
    setInterval(handler: TimerHandler, timeout?: number, ...arguments: unknown[]): number;
    clearInterval(id?: number): void;
  }
}

// Hogy a fájl modulként legyen kezelve
export {};
