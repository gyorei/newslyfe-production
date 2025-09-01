import React, { useEffect, useState } from 'react';

interface TerminalSpinnerProps {
  frames?: string[]; // animációs karakterek
  interval?: number; // ms
  active?: boolean; // animáljon-e
  done?: boolean; // ha true, csak pipa
  className?: string;
}

const defaultFrames = ['|', '/', '-', '\\'];

const TerminalSpinner: React.FC<TerminalSpinnerProps> = ({
  frames = defaultFrames,
  interval = 120,
  active = true,
  done = false,
  className = '',
}) => {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (!active || done) return;
    const id = setInterval(() => {
      setFrameIdx(idx => (idx + 1) % frames.length);
    }, interval);
    return () => clearInterval(id);
  }, [active, done, frames, interval]);

  if (done) {
    return <span className={className} style={{ color: '#00ff88', fontWeight: 'bold' }}>✓</span>;
  }
  if (!active) {
    return null;
  }
  return (
    <span className={className} style={{ color: '#ffd600', fontWeight: 'bold' }}>{frames[frameIdx]}</span>
  );
};

export default TerminalSpinner;
