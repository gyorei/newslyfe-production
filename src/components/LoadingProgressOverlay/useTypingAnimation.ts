// src\components\LoadingProgressOverlay\useTypingAnimation.ts
import { useState, useEffect } from 'react';

export interface TypingAnimationOptions {
  speed?: number; // ms/karakter
  delay?: number; // kezdési késleltetés
  onComplete?: () => void; // befejezés callback
}

export const useTypingAnimation = (
  text: string, 
  options: TypingAnimationOptions = {}
) => {
  const { speed = 50, delay = 0, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(delay === 0);

  // Késleltetett indítás
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsStarted(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // 🔧 RESET: Ha a text változik, reset-eljük az állapotot
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    setIsStarted(delay === 0);
  }, [text, delay]);

  // Gépírás animáció
  useEffect(() => {
    if (!isStarted || !text) return;

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
        // 🎯 CALLBACK: Értesítjük a szülő komponenst
        if (onComplete) {
          console.log('[TYPING COMPLETE] Calling onComplete for text:', text);
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isStarted, onComplete]);

  return { 
    displayedText, 
    isComplete, 
    isStarted 
  };
};