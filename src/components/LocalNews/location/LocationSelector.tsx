// src\components\LocalNews\location\LocationSelector.tsx

import React, { useState, useEffect } from 'react';
import { locationProvider } from './LocationProvider';
import GeoLocationPrompt from './strategies/GeoLocation/GeoLocationPrompt';
import type { LocationData } from './types';
import './LocationSelector.css';
import { locationStore } from './LocationStore';
import { getAllCountries } from '../../Utility/Settings/LocationSettings/continents';

interface CountryOption {
  name: string;
  code: string;
}

// Támogatott országok listája
const SUPPORTED_COUNTRIES: CountryOption[] = getAllCountries().map(c => ({
  name: c.native || c.name,
  code: c.code,
}));

/**
 * Ország kiválasztó komponens
 */
const LocationSelector: React.FC = () => {
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<Array<{ country: string; countryCode: string }>>([]);
  const [showGeoPrompt, setShowGeoPrompt] = useState<boolean>(false);

  // Aktuális ország és előzmények betöltése
  useEffect(() => {
    // NE indítsunk aszinkron helymeghatározást!
    setLoading(true);
    const initialLocation = locationStore.getLocation(); // Szinkron cache olvasás
    if (initialLocation) {
      setCurrentCountry(initialLocation.countryCode);
    }
    const locationHistory = locationProvider.getLocationHistory();
    setHistory(locationHistory);
    setLoading(false);
  }, []); // Csak egyszer fusson le

  // Ország váltás
  const handleCountryChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value;
    if (!countryCode) return;

    setLoading(true);

    try {
      // Az ország nevének megtalálása a kód alapján
      const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);

      if (country) {
        // Új ország beállítása
        await locationProvider.setManualLocation(country.name, countryCode);
        setCurrentCountry(countryCode);

        // Előzmények frissítése
        const locationHistory = locationProvider.getLocationHistory();
        setHistory(locationHistory);
      }
    } catch (error) {
      console.error('Hiba az ország váltásakor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Geolokációs helymeghatározás kezelése
  const handleGeoLocationSuccess = async (location: LocationData) => {
    try {
      setLoading(true);
      // Beállítjuk az új helyet a locationProvider használatával
      await locationProvider.setManualLocation(
        location.country,
        location.countryCode,
        location.city,
      );
      setCurrentCountry(location.countryCode);

      // Előzmények frissítése
      const locationHistory = locationProvider.getLocationHistory();
      setHistory(locationHistory);

      // Bezárjuk a geolokációs promptot
      setShowGeoPrompt(false);
    } catch (error) {
      console.error('Hiba a geolokációs helyadatok beállításakor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-selector">
      <div className="selector-container">
        <select
          value={currentCountry}
          onChange={handleCountryChange}
          disabled={loading}
          className="country-select"
        >
          <option value="" disabled>
            Ország kiválasztása
          </option>
          {SUPPORTED_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>

        {loading && <span className="loading-indicator">⏳</span>}
      </div>

      {/* Geolokációs gomb */}
      <button
        className="geo-location-button"
        onClick={() => setShowGeoPrompt(true)}
        title="Pontos helymeghatározás használata"
      >
        <span className="geo-icon">📍</span> Helymeghatározás
      </button>

      {/* Geolokációs prompt megjelenítése */}
      {showGeoPrompt && (
        <div className="geo-prompt-overlay">
          <GeoLocationPrompt
            onSuccess={handleGeoLocationSuccess}
            onCancel={() => setShowGeoPrompt(false)}
            onError={(error) => {
              console.error('Geolokációs hiba:', error);
              setShowGeoPrompt(false);
            }}
          />
        </div>
      )}

      {history.length > 0 && (
        <div className="history-container">
          <small>Előzmények:</small>
          <div className="history-items">
            {history.slice(0, 3).map((item, index) => (
              <button
                key={index}
                className="history-item"
                onClick={() => locationProvider.setManualLocation(item.country, item.countryCode)}
                disabled={loading || item.countryCode === currentCountry}
              >
                {item.country}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
