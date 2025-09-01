/*
// src\premium\PremiumPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  storeLicenseKey,
  clearLicenseKey,
  getPremiumState,
  onStateChange,
  getLicensePayload,
  PremiumState,
  exportUserData,
  importUserData,
} from './premiumManager';
*/
/**
 * Prémium panel - licenckulcs kezelés UI
 * Ez a verzió már a reaktív premiumManager-t használja.
 *//*
const PremiumPanel: React.FC = () => {
  const [status, setStatus] = useState<PremiumState>(getPremiumState());
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Feliratkozás az állapotváltozásokra
    const unsubscribe = onStateChange((newStatus) => {
      setStatus(newStatus);
      setIsProcessing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsProcessing(true);
    await storeLicenseKey(licenseKeyInput);
  };

  const handleClear = () => {
    clearLicenseKey();
    setLicenseKeyInput('');
  };

  const handleExport = () => {
    try {
      const dataToExport = exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `newslyfe_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Hiba történt az adatok exportálása közben.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        alert('Hiba: A fájl olvasása sikertelen.');
        return;
      }
      try {
        const data = JSON.parse(text);
        setIsProcessing(true);
        await importUserData(data);
        alert('Az adatok sikeresen importálva! A változások megtekintéséhez érdemes lehet frissíteni az oldalt.');
      } catch (error) {
        alert('Importálási hiba. A fájl valószínűleg sérült vagy nem megfelelő formátumú.');
        console.error('Import parse/process failed:', error);
      } finally {
        setIsProcessing(false);
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const licenseDetails = getLicensePayload();

  if (status === 'initializing') {
    return (
      <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
        <h2>Prémium Rendszer</h2>
        <p>Prémium állapot ellenőrzése...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, fontFamily: 'sans-serif' }}>
      <h2>Prémium Funkciók</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="license-input">Licenckulcs:</label>
        <input
          id="license-input"
          type="text"
          value={licenseKeyInput}
          onChange={e => setLicenseKeyInput(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          placeholder="Pl. PRO-YYYYMM-XXXXXXXXXXXXXXXX"
          disabled={isProcessing}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={handleSave} 
          style={{ flex: 1, padding: '8px 16px' }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Validálás...' : 'Mentés'}
        </button>
        <button 
          onClick={handleClear} 
          style={{ flex: 1, padding: '8px 16px', background: '#f5f5f5' }}
          disabled={isProcessing}
        >
          Törlés
        </button>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
        <strong>Státusz:</strong> 
        <span style={{ 
          color: status === 'pro' ? 'green' : status === 'invalid_key' ? 'red' : status === 'expired' ? '#b88600' : 'gray',
          marginLeft: 8
        }}>
          {status === 'pro' 
            ? '✔️ Prémium aktiválva' 
            : status === 'invalid_key' 
              ? '❌ Érvénytelen licenckulcs' 
              : status === 'expired'
                ? '⚠️ A licenckulcsod lejárt!'
                : '◌ Ingyenes verzió'}
        </span>
      </div>
      {(status === 'pro' || status === 'expired') && licenseDetails?.exp && (
        <div style={{ marginTop: 10, fontSize: '0.9em', color: '#555' }}>
          Érvényesség: {new Date(licenseDetails.exp).toLocaleDateString()}
        </div>
      )}
      {status === 'invalid_key' && (
        <div style={{ 
          color: 'red', 
          marginTop: 8,
          padding: 8,
          background: '#fff0f0',
          borderRadius: 4
        }}>
          A megadott kulcs érvénytelen. Kérjük ellenőrizd a kulcsot!
        </div>
      )}
      {status === 'expired' && (
        <div style={{ 
          color: '#b88600', 
          marginTop: 8,
          padding: 8,
          background: '#fffbe6',
          borderRadius: 4
        }}>
          ⚠️ A licenckulcsod lejárt. Kérjük vásárolj új kulcsot a prémium funkciókhoz!
        </div>
      )}
      {status === 'pro' && (
        <div style={{ 
          color: 'green', 
          marginTop: 16,
          padding: 12,
          background: '#f0fff0',
          borderRadius: 4
        }}>
          <h3>Prémium előnyök</h3>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Reklámmentes élmény</li>
            <li>Offline olvasási lehetőség</li>
            <li>Egyedi tartalmi ajánlók</li>
            <li>Korai hozzáférés új funkciókhoz</li>
          </ul>
        </div>
      )}*/
      {/* Export/Import szekció */}/*
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee' }}>
        <h4>Adatok és Beállítások</h4>
        <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0 12px' }}>
          Mentsd le az összes beállításodat és a licenckulcsodat egy fájlba, vagy tölts be egy korábbi mentést.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            Adatok Exportálása
          </button>
          <button onClick={handleImportClick} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            Adatok Importálása
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            accept=".json,application/json"
          />
        </div>
      </div>
    </div>
  );
};

export default PremiumPanel;
*/