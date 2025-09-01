// src\components\LoadingProgressOverlay\TerminalTypewriterStream.tsx
import React, { useRef, useEffect, useState } from 'react';
import BlinkingCursor from './BlinkingCursor';
import { TerminalLine } from './sourceData';
import TerminalSpinner from './TerminalSpinner/TerminalSpinner';
import TypewriterLine from './TypewriterLine';
import styles from "./LoadingProgressOverlay.module.css";

interface TerminalTypewriterStreamProps {
  lines: TerminalLine[];
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
}

const spinnerFramesClassic = ['|', '/', '-', '\\'];

const TerminalTypewriterStream: React.FC<TerminalTypewriterStreamProps> = ({
  lines,
  className,
  showCursor = true,
  cursorChar = '▌',
}) => {
  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTypingCommand, setIsTypingCommand] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when lines prop changes
  useEffect(() => {
    console.log('[TerminalTypewriterStream] Resetting state, new lines:', lines.length);
    setDisplayedLines([]);
    setCurrentIdx(0);
    setIsTypingCommand(false);
  }, [lines]);

  useEffect(() => {
    console.log('[RENDER] currentIdx:', currentIdx, 'displayedLines:', displayedLines.length, displayedLines.map(l => l.text));
    
    if (currentIdx >= lines.length) return;
    
    const line = lines[currentIdx];
    console.log('[ANIMATION] Animating line:', line.text, 'type:', line.type, 'status:', line.status);

    // 🎯 COMMAND TÍPUS: Karakterenkénti gépelés
    if (line.type === 'command') {
      console.log('[COMMAND TYPING] Starting typewriter for:', line.text);
      setIsTypingCommand(true);
      
      // Sor hozzáadása a displayedLines-hoz, de még üres szöveggel
      setDisplayedLines(prev => [...prev, { ...line, status: 'typing' }]);
      
      // A TypewriterLine komponens fogja kezelni a karakterenkénti gépelést
      // Az onComplete callback-ben lépünk tovább
      return;
    }

    // 🎯 PROCESS TÍPUS: Azonnali megjelenés + spinner
    if (line.type === 'process' && line.duration) {
      console.log('[PROCESS] Starting spinner for:', line.text);
      setDisplayedLines(prev => [...prev, { ...line, status: 'processing' }]);
      
      const timer = setTimeout(() => {
        setDisplayedLines(prev => prev.map(l =>
          l.id === line.id ? { ...l, status: 'done' } : l
        ));
        console.log('[SPINNER DONE] id:', line.id, 'text:', line.text);
        
        setTimeout(() => {
          console.log('[SPINNER NEXT] setCurrentIdx', currentIdx + 1);
          setCurrentIdx(currentIdx + 1);
        }, 300);
      }, line.duration);
      
      return () => clearTimeout(timer);
    }

    // 🎯 MINDEN MÁS TÍPUS: Azonnali megjelenés
    else {
      console.log('[INSTANT] Showing line instantly:', line.text);
      setDisplayedLines(prev => [...prev, { ...line, status: 'done' }]);
      
      const nextTimer = setTimeout(() => {
        console.log('[INSTANT NEXT] setCurrentIdx', currentIdx + 1);
        setCurrentIdx(currentIdx + 1);
      }, 150); // Kicsit hosszabb késleltetés az olvashatóságért
      
      return () => clearTimeout(nextTimer);
    }
  }, [currentIdx, lines]);

  // 🎯 CALLBACK: Amikor a command gépelés befejeződik
  const handleCommandTypingComplete = () => {
    console.log('[COMMAND TYPING COMPLETE] Moving to next line');
    setIsTypingCommand(false);
    
    // Frissítjük a sor státuszát 'done'-ra
    setDisplayedLines(prev => prev.map((l, i) =>
      i === prev.length - 1 ? { ...l, status: 'done' } : l
    ));
    
    // Kis késleltetés után továbblépés
    setTimeout(() => {
      console.log('[COMMAND NEXT] setCurrentIdx', currentIdx + 1);
      setCurrentIdx(currentIdx + 1);
    }, 200);
  };

  // Auto-scroll
  useEffect(() => {
    const scroll = () => {
      const el = containerRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    };
    scroll();
  }, [displayedLines]);

  return (
    <div
      ref={containerRef}
      className={`${styles.terminalStream} ${className || ''}`}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {displayedLines.map((line, index) => {
        // 🎯 COMMAND típus: TypewriterLine használata karakterenkénti gépeléshez
        if (line.type === 'command' && line.status === 'typing') {
          return (
            <TypewriterLine
              key={line.id}
              text={line.text}
              className={`${styles.logLine} ${styles[line.type] || ''}`}
              speed={20} // 80ms/karakter - természetes gépelés sebesség
              showCursor={false} // Saját cursor lesz a végén
              onComplete={handleCommandTypingComplete}
            />
          );
        }

        // 🎯 MINDEN MÁS: Normál megjelenítés
        return (
          <div key={line.id} className={`${styles.logLine} ${styles[line.type] || ''}`}>
            <span>{line.text} </span>
            {line.type === 'process' && (
              <TerminalSpinner
                frames={spinnerFramesClassic}
                active={line.status === 'processing'}
                done={line.status === 'done'}
              />
            )}
          </div>
        );
      })}
      
      {/* 🎯 CURSOR: Csak akkor mutassuk, ha nem gépelünk command-ot */}
      {showCursor && !isTypingCommand && (
        <BlinkingCursor show={true} char={cursorChar} />
      )}
    </div>
  );
};

export default TerminalTypewriterStream;