import { useState, useEffect } from 'react';
import { ApiClient } from '../apiclient/apiClient';

interface ServerHealth {
  isReady: boolean;
  isChecking: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Hook a szerver állapot kezeléséhez
 * Automatikusan ellenőrzi a szerver elérhetőségét és újrapróbálkozik szükség esetén
 */
export function useServerHealth(): ServerHealth {
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = ApiClient.getInstance();

  const checkServerHealth = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('[useServerHealth] Szerver állapot ellenőrzése...');
      console.log('[useServerHealth] 📱 User Agent:', navigator.userAgent);
      console.log('[useServerHealth] 🌐 API URL:', import.meta.env.VITE_API_URL);
      console.log('[useServerHealth] 📱 Screen size:', window.innerWidth, 'x', window.innerHeight);
      
      // TESZT MÓD: Ha a localStorage-ben van 'test-slow-server', szimuláljuk a lassú indítást
      const testSlowServer = localStorage.getItem('test-slow-server') === 'true';
      if (testSlowServer) {
        console.log('[useServerHealth] 🧪 TESZT MÓD: Lassú szerver szimulálása...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 másodperc várakozás
        console.log('[useServerHealth] 🧪 TESZT MÓD: Várakozás vége, szerver "kész"');
      }
      
      console.log('[useServerHealth] ⏱️ Szerver várakozás indítása (60s timeout, 2s interval)...');
      const isAvailable = await apiClient.waitForServer(60, 2000); // Mobilra optimalizált: 60s timeout, 2s interval
      
      if (isAvailable) {
        setIsReady(true);
        console.log('[useServerHealth] ✅ Szerver kész!');
      } else {
        setError('A szerver nem elérhető. Kérlek ellenőrizd a kapcsolatot.');
        console.error('[useServerHealth] ❌ Szerver nem elérhető');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ismeretlen hiba';
      setError(`Szerver kapcsolat hiba: ${errorMessage}`);
      console.error('[useServerHealth] Hiba:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const retry = () => {
    checkServerHealth();
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  return {
    isReady,
    isChecking,
    error,
    retry
  };
} 