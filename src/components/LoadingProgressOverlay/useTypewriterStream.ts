import { useState, useEffect } from 'react';

export interface TypewriterStreamOptions {
  speed?: number; // ms/karakter
  delay?: number; // kezdési késleltetés
  onComplete?: () => void;
}

export const useTypewriterStream = (
  lines: string[],
  options: TypewriterStreamOptions = {}
) => {
  const { speed = 30, delay = 0, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(delay === 0);

  // Sorok összeillesztése \n-ökkel
  const fullText = lines.join('\n');

  // Késleltetett indítás
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsStarted(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // ✅ FOLYAMATOS KARAKTERFOLYAM - egy stream!
  useEffect(() => {
    if (!isStarted || !fullText) return;

    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.substring(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [fullText, speed, isStarted, onComplete]);

  return { 
    displayedText, 
    isComplete, 
    isStarted 
  };
};