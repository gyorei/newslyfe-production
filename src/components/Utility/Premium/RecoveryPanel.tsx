// src\components\Utility\Premium\RecoveryPanel.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RecoveryPanel - Prémium licenckulcs visszaállítása recovery kóddal
 * Egy helyen a PremiumPanel-lel, egységes UX!
 */
const RecoveryPanel: React.FC = () => {
  const { t } = useTranslation();
  const [recoveryCode, setRecoveryCode] = useState('');
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    setError(null);
    setRestoredKey(null);
    try {
      const response = await fetch('/api/recover/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recoveryCode }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.licenseKey) {
        setRestoredKey(data.licenseKey);
      } else {
        setError(data.error || t('recovery.error.unknown'));
      }
    } catch (err) {
      setError(t('recovery.error.network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, fontFamily: 'sans-serif' }}>
      <h3>{t('recovery.title')}</h3>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="recovery-input">{t('recovery.recoveryCodeLabel')}</label>
        <input
          id="recovery-input"
          type="text"
          value={recoveryCode}
          onChange={e => setRecoveryCode(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          placeholder={t('recovery.placeholder')}
          disabled={loading}
        />
      </div>
      <button
        onClick={handleRestore}
        style={{ width: '100%', padding: '10px 16px', marginBottom: 8 }}
        disabled={loading || !recoveryCode.trim()}
      >
        {loading ? t('recovery.restoring') : t('recovery.restoreButton')}
      </button>
      {restoredKey && (
        <div style={{ marginTop: 16, padding: 12, background: '#f0fff0', borderRadius: 4, color: 'green' }}>
          <strong>{t('recovery.success.title')}</strong> {t('recovery.success.message')}
          <div style={{ marginTop: 8, wordBreak: 'break-all', fontWeight: 'bold' }}>{restoredKey}</div>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#fff0f0', borderRadius: 4, color: 'red' }}>
          <strong>{t('recovery.error.title')}</strong> {error}
        </div>
      )}
    </div>
  );
};

export default RecoveryPanel;
