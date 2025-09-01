// src\components\LoadingProgressOverlay\BlinkingCursor.tsx
import React, { useState, useEffect } from 'react';

interface BlinkingCursorProps {
  show?: boolean;
  char?: string; // '▌' vagy '_' vagy '█'
  speed?: number; // villogás sebessége ms-ben
  className?: string;
}

const BlinkingCursor: React.FC<BlinkingCursorProps> = ({ 
  show = true, 
  char = '▌',
  speed = 500,
  className = ''
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setVisible(v => !v);
    }, speed);

    return () => clearInterval(interval);
  }, [show, speed]);

  if (!show) return null;

  return (
    <span 
      className={className}
      style={{
        fontWeight: 'bold',
        display: 'inline'
      }}
      role="presentation"
    >
      {visible ? char : '\u00A0'} {/* Non-breaking space helyett space */}
    </span>
  );
};

export default BlinkingCursor;
