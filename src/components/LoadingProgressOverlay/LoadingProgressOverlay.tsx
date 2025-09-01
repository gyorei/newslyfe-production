// src\components\LoadingProgressOverlay\LoadingProgressOverlay.tsx
/*
🟢 Ha hosszú a szimulált terminálszöveg → scroll aktiválódik → ugrás történik.
🔴 Ha rövid a szöveg (nem éri el a konténer alját), nincs automatikus scroll, ezért nincs ugrás sem.
*/
import React, { useState, useEffect } from "react";
import styles from "./LoadingProgressOverlay.module.css";
import BlinkingCursor from "./BlinkingCursor";
import TerminalTypewriterStream from "./TerminalTypewriterStream";
import { TerminalLine } from './sourceData';

interface LoadingProgressOverlayProps {
  country?: string;
  hideOverlay?: boolean;
}

interface AnimationPhase {
  phase: "cursor" | "stream" | "complete";
}

// Segédfüggvény a sor típusának felismeréséhez
const getLineType = (line: string): TerminalLine['type'] => {
  if (line.startsWith('$ ')) return 'command';
  if (line.includes('INFO:')) return 'info';
  if (line.includes('DONE:') || line.includes('✓')) return 'success';
  return 'default';
};

// Központi függvény: generálja a TerminalLine[]-t
const generateTerminalLines = (country: string): TerminalLine[] => {
  const timestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
  const countryUpper = country.toUpperCase();
  const countryLower = country.toLowerCase();

  const rawLines = [
    "$ whoami",
    "newsbot", // 🔧 JAVÍTÁS: Ez most már meg fog jelenni!
    "",
    "$ cd /opt/news-aggregator",
    "",
    `$ ./fetch-news.sh --country=${countryLower}`,
    `[${timestamp()}] INFO: Starting news aggregation for ${countryUpper}`,
    { text: `[${timestamp()}] INFO: Loading configurations...`, duration: 1000 },
    { text: `[${timestamp()}] INFO: Connecting to API endpoints...`, duration: 1200 },
    { text: `[${timestamp()}] INFO: Authenticating...`, duration: 900 },
    `[${timestamp()}] INFO: Token valid ✓`,
    { text: `[${timestamp()}] INFO: Fetching articles from sources...`, duration: 1800 },
    { text: `[${timestamp()}] INFO: Processing articles...`, duration: 1500 },
    `[${timestamp()}] INFO: Database update complete. ✓`,
    `[${timestamp()}] DONE: Aggregation complete!`,
    `[${timestamp()}] INFO: Launching news feed...`,
    "$ _"
  ];

  return rawLines.map((line, index) => {
    // 🔧 JAVÍTÁS: Egyedi és stabil ID generálás
    const baseId = `line-${index}-${Date.now()}`;
    
    if (typeof line === 'object' && line !== null) {
      return {
        id: `${baseId}-process`,
        text: line.text,
        type: 'process' as const,
        status: 'pending' as const,
        duration: line.duration,
      };
    }
    
    return {
      id: `${baseId}-${getLineType(line as string)}`,
      text: line as string,
      type: getLineType(line as string),
      status: 'pending' as const,
    };
  });
};

const LoadingProgressOverlay: React.FC<LoadingProgressOverlayProps> = ({
  country = "",
  hideOverlay = false,
}) => {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>({ phase: "cursor" });
  
  // 🔧 JAVÍTÁS: terminalLines csak egyszer generálódjon, ne minden render-nél!
  const [terminalLines] = useState(() => generateTerminalLines(country));

  useEffect(() => {
    const cursorTimer = setTimeout(() => {
      setAnimationPhase({ phase: "stream" });
    }, 2000);
    return () => clearTimeout(cursorTimer);
  }, []);

  if (hideOverlay) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.terminalBox}>
        <div className={styles.logArea}>
          {animationPhase.phase === "cursor" && (
            <BlinkingCursor show={true} className={styles.cursor} />
          )}

          {animationPhase.phase === "stream" && (
            <TerminalTypewriterStream
              lines={terminalLines}
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