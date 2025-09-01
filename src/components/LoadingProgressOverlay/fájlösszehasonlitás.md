régi 

// src\components\LoadingProgressOverlay\LoadingProgressOverlay.tsx
/*
🟢 Ha hosszú a szimulált terminálszöveg → scroll aktiválódik → ugrás történik.
🔴 Ha rövid a szöveg (nem éri el a konténer alját), nincs automatikus scroll, ezért nincs ugrás sem.


*/
import React, { useState, useEffect } from "react";
import styles from "./LoadingProgressOverlay.module.css";
import BlinkingCursor from "./BlinkingCursor";
import TerminalTypewriterStream from "./TerminalTypewriterStream";
import { SHOW_DOMAINS_IN_TERMINAL, prepareTerminalAnimationData } from "./sourceDataLoader";

interface LoadingProgressOverlayProps {
  country?: string;
  hideOverlay?: boolean; // ✅ ÚJ: Külső vezérlés az overlay eltűnéséhez
}

// ✅ EGYSZERŰSÍTETT: Csak 3 fázis
interface AnimationPhase {
  phase: "cursor" | "stream" | "complete";
}

const LoadingProgressOverlay: React.FC<LoadingProgressOverlayProps> = ({
  country = "",
  hideOverlay = false, // ✅ ÚJ: Alapértelmezetten látható
}) => {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>({
    phase: "cursor",
  });

  const getBashCommands = (country: string) => {
    const timestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
    const countryUpper = country.toUpperCase();
    const countryLower = country.toLowerCase();
  
    return [
      "$ whoami",
      "newsbot",
      "",
      "$ cd /opt/news-aggregator",
      "",
      "",
      `$ ./fetch-news.sh --country=${countryLower}`,
      `[${timestamp()}] INFO: Starting news aggregation for ${countryUpper}`,
      `[${timestamp()}] INFO: Loading RSS feed configurations...`,
      `[${timestamp()}] INFO: Found 8 active sources for ${countryUpper} region`,
      `[${timestamp()}] INFO: Connecting to API endpoints...`,
      `[${timestamp()}] INFO: Authenticating...`,
      `[${timestamp()}] INFO: Token valid ✓`,
      `[${timestamp()}] INFO: Fetching articles from sources...`,
      `[${timestamp()}] INFO: Processing articles...`,
      `[${timestamp()}] INFO: Filtering duplicates...`,
      `[${timestamp()}] INFO: Sorting by relevance and date...`,
      `[${timestamp()}] INFO: Formatting articles for display...`,
      `[${timestamp()}] INFO: Saving to database...`,
      `[${timestamp()}] INFO: Articles fetched successfully!`,
      `[${timestamp()}] INFO: Fetching articles...`,
      `[${timestamp()}] INFO: 44 articles retrieved successfully`,
     
    ];
  };
  
  const terminalData = prepareTerminalAnimationData(country);
  const domainLines = terminalData?.domains.map(domain => `[CONNECT] ▶ ${domain} ... ok`) || [];

  const allLines = [
    ...getBashCommands(country),
    ...(SHOW_DOMAINS_IN_TERMINAL ? domainLines : []),
    "$ _"
  ].filter(line => line !== undefined && line !== null);

  // ✅ FÁZIS 1: Kurzor (0-1 sec) - terv szerint 2-3 villogás
  useEffect(() => {
    const cursorTimer = setTimeout(() => {
      setAnimationPhase({ phase: "stream" });
    }, 2000);

    return () => clearTimeout(cursorTimer);
  }, []);

  // ✅ ÚJ: Ha hideOverlay true, akkor ne jelenjen meg az overlay
  if (hideOverlay) {
    return null;
  }

return (
  <div className={styles.overlay}>
    <div className={styles.terminalBox}>
      <div className={styles.logArea}>
        {animationPhase.phase === "cursor" && (
          <div className={styles.terminalContent}>
           <BlinkingCursor show={true} className={styles.cursor} />
          </div>
        )}

        {animationPhase.phase === "stream" && (
          <TerminalTypewriterStream
            lines={allLines}
            speed={2}
            delay={0}
            className={styles.systemMessage}
            showCursor={true}
          />
        )}
      </div>
    </div>
  </div>
);

};

export default LoadingProgressOverlay;


import React, { useRef, useEffect } from 'react';
import { useTypewriterStream, TypewriterStreamOptions } from './useTypewriterStream';
import BlinkingCursor from './BlinkingCursor';
import styles from './LoadingProgressOverlay.module.css';

interface TerminalTypewriterStreamProps extends TypewriterStreamOptions {
  lines: string[];
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
}

const TerminalTypewriterStream: React.FC<TerminalTypewriterStreamProps> = ({
  lines,
  className,
  showCursor = true,
  cursorChar = '▌',
  ...streamOptions
}) => {
  const { displayedText, isStarted } = useTypewriterStream(lines, streamOptions);
  
  // ✅ AUTO-SCROLL: Container referencia
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ AUTO-SCROLL: Minden karakter után scroll az aljára
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]); // ✅ Minden karakterváltozásnál scroll

  if (!isStarted) return null;


  return (
    <div 
      ref={containerRef}
      className={`${styles.terminalStream} ${className || ''}`}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <pre style={{ 
        fontFamily: 'Courier New, monospace',
        color: '#00ff88',
        margin: 0,
        padding: 0,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        lineHeight: 1.4 
      }} className={styles.streamContent}>
        {displayedText}
        {showCursor && <BlinkingCursor show={true} char={cursorChar} />}
      </pre>
    </div>
  );

};

export default TerminalTypewriterStream;
===============================================
