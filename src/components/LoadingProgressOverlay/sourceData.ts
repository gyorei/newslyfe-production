// TypeScript típusok a forrás adatok kezeléséhez

// Terminál animációs sor típus (Szent Grál)
export interface TerminalLine {
  id: string; // Egyedi azonosító a React key-hez
  text: string; // A sor szövege
  type: 'command' | 'info' | 'success' | 'warn' | 'error' | 'process' | 'default';
  status: 'pending' | 'typing' | 'processing' | 'done';
  duration?: number; // A 'process' típusú soroknál a spinner ideje (ms)
}

export interface SourceItem {
  imp: number;
  country: string;
  title: string;
  url: string;
  rssFeed: string;
  language: string;
  continent: string;
  id: string;
  sections: string[];
}

export interface CountrySourceData {
  [countryKey: string]: SourceItem[];
}

export interface ProcessedSourceData {
  countryName: string;
  sourceCount: number;
  domains: string[];
  sources: SourceItem[];
}

export interface TerminalAnimationData {
  countryName: string;
  sourceCount: number;
  domains: string[];
  sampleSources: Array<{
    domain: string;
    title: string;
    latency: number;
  }>;
}