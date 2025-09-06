// src\components\Utility\Premium\PremiumPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      alert(t('premium.errors.exportFailed'));
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
        alert(t('premium.errors.readFileFailed'));
        return;
      }
      try {
        const data = JSON.parse(text);
        setIsProcessing(true);
        await importUserData(data);
        alert(t('premium.dataSettings.importSuccess'));
      } catch (error) {
        alert(t('premium.errors.importFailed'));
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
        <h2>{t('premium.system')}</h2>
        <p>{t('premium.checkingStatus')}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, fontFamily: 'sans-serif' }}>
      <h2>{t('premium.title')}</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="license-input">{t('premium.licenseKeyLabel')}</label>
        <input
          id="license-input"
          type="text"
          value={licenseKeyInput}
          onChange={e => setLicenseKeyInput(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          placeholder={t('premium.placeholder')}
          disabled={isProcessing}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={handleSave} 
          style={{ flex: 1, padding: '8px 16px' }}
          disabled={isProcessing}
        >
          {isProcessing ? t('premium.buttons.validating') : t('premium.buttons.save')}
        </button>
        <button 
          onClick={handleClear} 
          style={{ flex: 1, padding: '8px 16px', background: '#f5f5f5' }}
          disabled={isProcessing}
        >
          {t('premium.buttons.clear')}
        </button>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
        <strong>{t('premium.status.label')}</strong> 
        <span style={{ 
          color: status === 'pro' ? 'green' : status === 'invalid_key' ? 'red' : status === 'expired' ? '#b88600' : 'gray',
          marginLeft: 8
        }}>
          {status === 'pro' 
            ? t('premium.status.pro')
            : status === 'invalid_key' 
              ? t('premium.status.invalidKey')
              : status === 'expired'
                ? t('premium.status.expired')
                : t('premium.status.free')}
        </span>
      </div>
      {(status === 'pro' || status === 'expired') && licenseDetails?.exp && (
        <div style={{ marginTop: 10, fontSize: '0.9em', color: '#555' }}>
          {t('premium.validUntil')} {new Date(licenseDetails.exp).toLocaleDateString()}
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
          {t('premium.errors.invalidKey')}
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
          {t('premium.errors.expired')}
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
          <h3>{t('premium.benefits.title')}</h3>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>{t('premium.benefits.adFree')}</li>
            <li>{t('premium.benefits.offline')}</li>
            <li>{t('premium.benefits.personalized')}</li>
            <li>{t('premium.benefits.earlyAccess')}</li>
          </ul>
        </div>
      )}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee' }}>
        <h4>{t('premium.dataSettings.title')}</h4>
        <p style={{ fontSize: '0.9em', color: '#666', margin: '4px 0 12px' }}>
          {t('premium.dataSettings.description')}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            {t('premium.buttons.export')}
          </button>
          <button onClick={handleImportClick} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer', background: '#f0f9ff', border: '1px solid #e0f2fe' }} disabled={isProcessing}>
            {t('premium.buttons.import')}
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