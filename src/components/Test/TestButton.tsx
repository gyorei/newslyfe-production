// @ts-nocheck

import * as React from 'react';

interface TestButtonProps {
  onTestClick: () => void;
}

export const TestButton: React.FC<TestButtonProps> = ({ onTestClick }) => {
  const handleClick = () => {
    // Eredeti funkció meghívása
    onTestClick();

    // Debug üzenet
    console.log('🔍 Debug gomb megnyomva');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        padding: '5px 10px',
        background: 'purple',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <span>🐛</span>
      <span>Debug</span>
    </button>
  );
};

export default TestButton;

/*
import * as React from 'react';
import { debugHirekBetoltes } from '../Card/cardService';

interface TestButtonProps {
  onTestClick: () => void;
}

export const TestButton: React.FC<TestButtonProps> = ({ onTestClick }) => {
  const handleClick = async () => {
    // Eredeti funkció meghívása
    onTestClick();
    
    // Hírek debug indítása
    console.log('🔍 Hírek debug indítása...');
    await debugHirekBetoltes();
  };

  return (
    <button 
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        padding: '5px 10px',
        background: 'purple',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
    >
      <span>🐛</span>
      <span>Debug Hírek</span>
    </button>
  );
};*/
