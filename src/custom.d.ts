declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    electronAPI?: {
      minimize?: () => void;
      maximize?: () => void;
      close?: () => void;
      openUrlInTab?: (url: string) => void;
      onOpenUrlInTab?: (callback: (event: any, url: string) => void) => void;
      openArticleView?: (url: string, tabContentRect?: any) => void;
      closeArticleView?: () => void;
      positionBrowserView?: (tabContentRect: any) => void;
      openArticleWindow?: (url: string) => void;
      openArticleByPreference?: (url: string, tabContentRect?: any) => void;
      getArticleViewMode?: () => Promise<'window' | 'embedded' | 'tab'>;
      setArticleViewMode?: (mode: 'window' | 'embedded' | 'tab') => Promise<void>;
      getArticleWindowStyle?: () => Promise<'classic' | 'modern' | 'dark' | 'compact'>;
      setArticleWindowStyle?: (style: 'classic' | 'modern' | 'dark' | 'compact') => Promise<void>;
      getAllSettings?: () => Promise<any>;
      onBrowserViewClosed?: (callback: () => void) => void;
      onArticleViewOpened?: (callback: () => void) => void;
      openLastClosedArticleView?: () => void;
    };
    adsbygoogle?: unknown[];
  }
}

export {};
