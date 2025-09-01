// src\components\SplashScreen\SplashScreen.tsx
import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  return (
    <div className="splash-screen">
      <video
        src="/newslyfe-video.mp4"
        autoPlay
        muted
        playsInline
        className="splash-video"
      />
    </div>
  );
};

export default SplashScreen;