// src/types/index.d.ts

// Duplikált payload típus, import nélkül!
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export {};