// src\components\SplashScreen\SplashScreen.tsx
import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobil eszköz detektálása
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      return isMobileDevice || isSmallScreen;
    };

    setIsMobile(checkIsMobile());
  }, []);

  return (
    <div className="splash-screen">
      {!isMobile ? (
        <video
          src="/newslyfe-video.mp4"
          autoPlay
          muted
          playsInline
          className="splash-video"
        />
      ) : (
        <div className="splash-logo">
          <h1>NewsLyfe</h1>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;