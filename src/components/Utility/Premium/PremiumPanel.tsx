// src\components\Utility\Premium\PremiumPanel.tsx
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
  initializePremiumManager,
} from './premiumManager';
import RecoveryPanel from './RecoveryPanel';

const PremiumPanel: React.FC = () => {
  const [status, setStatus] = useState<PremiumState>(getPremiumState());
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Prémium rendszer inicializálása a panel betöltésekor
    initializePremiumManager();
  }, []);

  useEffect(() => {
    const unsubscribe = onStateChange((newStatus) => {
      setStatus(newStatus);
      setIsProcessing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsProcessing(true);
    await storeLicenseKey(licenseKeyInput);
    setLicenseKeyInput(''); // Ez opcionális, ha mentés után ki akarod üríteni az inputot
    setIsProcessing(false); // FONTOS: a mentés után állítsd vissza!
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
      alert('An error occurred while exporting data.');
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
        alert('Error: Failed to read the file.');
        return;
      }
      try {
        const data = JSON.parse(text);
        setIsProcessing(true);
        await importUserData(data);
        alert('Data imported successfully! You may want to refresh the page to see the changes.');
      } catch (error) {
        alert('Import error. The file is probably corrupted or in an incorrect format.');
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
        <h2>Premium System</h2>
        <p>Checking premium status...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, fontFamily: 'sans-serif' }}>
      <h2>Prémium Funkciók</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="license-input">License key:</label>
        <input
          id="license-input"
          type="text"
          value={licenseKeyInput}
          onChange={e => setLicenseKeyInput(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          placeholder="e.g. PRO-YYYYMM-XXXXXXXXXXXXXXXX"
          disabled={isProcessing}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={handleSave} 
          style={{ flex: 1, padding: '8px 16px' }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Validating...' : 'Save'}
        </button>
        <button 
          onClick={handleClear} 
          style={{ flex: 1, padding: '8px 16px', background: '#f5f5f5' }}
          disabled={isProcessing}
        >
          Clear
        </button>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
        <strong>Status:</strong> 
        <span style={{ 
          color: status === 'pro' ? 'green' : status === 'invalid_key' ? 'red' : status === 'expired' ? '#b88600' : 'gray',
          marginLeft: 8
        }}>
          {status === 'pro' 
            ? '✔️ Premium activated' 
            : status === 'invalid_key' 
              ? '❌ Invalid license key' 
              : status === 'expired'
                ? '⚠️ Your license key has expired!'
                : '◌ Free version'}
        </span>
      </div>
      {(status === 'pro' || status === 'expired') && licenseDetails?.exp && (
        <div style={{ marginTop: 10, fontSize: '0.9em', color: '#555' }}>
          Valid until: {new Date(licenseDetails.exp).toLocaleDateString()}
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
          The provided key is invalid. Please check your key!
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
          ⚠️ Your license key has expired. Please purchase a new key for premium features!
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
          <h3>Premium benefits</h3>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Ad-free experience</li>
            <li>Offline reading</li>
            <li>Personalized recommendations</li>
            <li>Early access to new features</li>
          </ul>
        </div>
      )}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee' }}>
        <h4>Data & Settings</h4>
        <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0 12px' }}>
          Save all your settings and license key to a file, or restore from a previous backup.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            Export Data
          </button>
          <button onClick={handleImportClick} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            Import Data
          </button>
          <input
            id="import-file-input"
            name="importFile"
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            accept=".json,application/json"
          />
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <RecoveryPanel />
      </div>
    </div>
  );
};

export default PremiumPanel;