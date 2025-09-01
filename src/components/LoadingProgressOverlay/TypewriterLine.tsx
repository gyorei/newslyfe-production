// src\components\LoadingProgressOverlay\TypewriterLine.tsx
import React from 'react';
import { useTypingAnimation, TypingAnimationOptions } from './useTypingAnimation';
import BlinkingCursor from './BlinkingCursor';
import styles from './LoadingProgressOverlay.module.css';

interface TypewriterLineProps extends TypingAnimationOptions {
  text: string;
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
}

const TypewriterLine: React.FC<TypewriterLineProps> = ({
  text,
  className,
  showCursor = true,
  cursorChar = '▌',
  ...animationOptions
}) => {
  const { displayedText, isComplete, isStarted } = useTypingAnimation(text, animationOptions);

  if (!isStarted) return null;

  return (
    <div className={`${styles.logLine} ${className || ''}`}>
      <span style={{whiteSpace: 'pre'}}>
        {displayedText}
        {showCursor && !isComplete && (
          <BlinkingCursor show={true} char={cursorChar} />
        )}
      </span>
    </div>
  );
};

export default TypewriterLine;