import React, { useEffect, useState } from 'react';
import { AD_CLIENT, AD_SLOT_DEFAULT, IS_AD_CONFIG_VALID } from '../../apiclient/adConfig';

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 99999,
  background: 'rgba(30,30,30,0.97)',
  color: '#fff',
  borderRadius: 10,
  boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
  padding: '18px 22px 14px 18px',
  fontSize: 14,
  minWidth: 260,
  maxWidth: 340,
  fontFamily: 'monospace',
  lineHeight: 1.6,
  pointerEvents: 'auto',
};
const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 8,
};
const labelStyle: React.CSSProperties = {
  color: '#90caf9',
  fontWeight: 600,
};
const slotStyle: React.CSSProperties = {
  background: '#222',
  borderRadius: 4,
  padding: '2px 6px',
  margin: '2px 0',
  fontSize: 13,
  display: 'block',
};
const warningStyle: React.CSSProperties = {
  background: '#ff9800',
  color: '#222',
  borderRadius: 6,
  padding: '6px 10px',
  margin: '10px 0 0 0',
  fontWeight: 700,
  fontSize: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
};

function detectAdBlock(): boolean {
  // Create a dummy adsbygoogle element
  const test = document.createElement('div');
  test.className = 'adsbygoogle';
  test.style.height = '1px';
  test.style.width = '1px';
  test.style.position = 'absolute';
  test.style.left = '-9999px';
  document.body.appendChild(test);
  const blocked = getComputedStyle(test).display === 'none' || test.offsetParent === null;
  document.body.removeChild(test);
  return blocked;
}

export const AdSenseDebugPanel: React.FC = () => {
  const [ads, setAds] = useState<Array<{ slot: string; visible: boolean }>>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    setScriptLoaded(!!window.adsbygoogle);
    const nodes = Array.from(document.querySelectorAll('.adsbygoogle')) as HTMLElement[];
    setAds(
      nodes.map((el) => ({
        slot: el.getAttribute('data-ad-slot') || '(none)',
        visible: !!(el.offsetParent !== null && el.offsetHeight > 0 && el.offsetWidth > 0),
      }))
    );
    setAdBlockDetected(detectAdBlock());
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>AdSense Debug Panel</div>
      <div><span style={labelStyle}>AD_CLIENT:</span> {AD_CLIENT || <i>empty</i>}</div>
      <div><span style={labelStyle}>AD_SLOT_DEFAULT:</span> {AD_SLOT_DEFAULT || <i>empty</i>}</div>
      <div><span style={labelStyle}>IS_AD_CONFIG_VALID:</span> {String(IS_AD_CONFIG_VALID)}</div>
      <div><span style={labelStyle}>Script loaded:</span> {String(scriptLoaded)}</div>
      <div><span style={labelStyle}>AdBlock detected:</span> {String(adBlockDetected)}</div>
      {adBlockDetected && (
        <div style={warningStyle}>
          ⚠️ AdBlocker detected! Ads may not display. Fallback or promo content recommended.
        </div>
      )}
      <div style={{marginTop: 10, marginBottom: 2, fontWeight: 600}}>adsbygoogle elements:</div>
      {ads.length === 0 && <div style={{color:'#bbb'}}>No .adsbygoogle elements found.</div>}
      {ads.map((ad, i) => (
        <div key={i} style={slotStyle}>
          slot: <b>{ad.slot}</b> | visible: <b>{String(ad.visible)}</b>
        </div>
      ))}
    </div>
  );
}; 