// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
//  - ne vezess be komplexitást
//  , amíg nincs rá valódi igény.

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LocationSettings.module.css';
import { locationProvider } from '../../../LocalNews/location/LocationProvider';
// Importáljuk a continents.ts-ből a szükséges adatokat és függvényeket
import { CONTINENTS, findCountryByCode, findContinentByCountryCode } from './continents';
// React-Select import és a szükséges típusokkal
import Select, {
  StylesConfig,
  GroupBase,
  ControlProps,
  MenuListProps,
  OptionProps,
  CSSObjectWithLabel,
} from 'react-select';

// Típus a React-Select opciókhoz
type OptionType = {
  value: string;
  label: string;
};

export const LocationSettings: React.FC = () => {
  const { t } = useTranslation();
  // Kiválasztott helymeghatározási mód
  const [locationType, setLocationType] = useState<'manual' | 'geo' | 'browser'>('manual');

  // Kontinens és ország választás
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');

  // GPS mód esetén
  const [highAccuracy, setHighAccuracy] = useState<boolean>(true);

  // Általános beállítások
  const [saveHistory, setSaveHistory] = useState<boolean>(true);

  // Helyelőzmények
  const [locationHistory, setLocationHistory] = useState<
    Array<{ country: string; countryCode: string; city?: string }>
  >([]);

  // Mentés állapot
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // A korábban kiválasztott országhoz tartozó kontinens megtalálása
  useEffect(() => {
    if (country) {
      // A findContinentByCountryCode függvényt használjuk
      const continent = findContinentByCountryCode(country);
      if (continent) {
        setSelectedContinent(continent.code);
      }
    }
  }, [country]);

  // Aktuális helyadatok betöltése
  useEffect(() => {
    const loadCurrentSettings = async () => {
      try {
        // Jelenlegi hely lekérése
        const location = await locationProvider.getLocation();

        // Helymeghatározási mód beállítása a jelenlegi forrás alapján
        if (location) {
          switch (location.source) {
            case 'manual':
              setLocationType('manual');
              break;
            case 'gps':
              setLocationType('geo');
              break;
            case 'browser':
              setLocationType('browser');
              break;
            default:
              setLocationType('manual');
          }

          // Ha az ország ismert, beállítjuk
          if (location.country && location.countryCode) {
            setCountry(location.countryCode);
            // A kontinenst automatikusan beállítja a másik useEffect
          }

          // Ha a város ismert, beállítjuk
          if (location.city) {
            setCity(location.city);
          }
        }

        // Helyelőzmények betöltése
        const history = locationProvider.getLocationHistory();
        setLocationHistory(history);
      } catch (error) {
        console.error('Hiba a helyadatok betöltése közben:', error);
      }
    };

    loadCurrentSettings();
  }, []);

  // Mentés kezelése
  const handleSave = useCallback(async () => {
    setSaveStatus('idle');
    setIsSaving(true);

    console.log(`[LocationSettings] Mentés kezdése, mód: ${locationType}`); // DEBUG

    try {
      switch (locationType) {
        case 'manual': {
          // Ellenőrizzük, hogy van-e kiválasztott ország
          if (!country) {
            alert(t('locationSettings.alerts.selectCountry'));
            setIsSaving(false);
            return;
          }

          // A findCountryByCode függvényt használjuk a kód alapján
          const countryObj = findCountryByCode(country);
          if (!countryObj) {
            throw new Error(t('locationSettings.alerts.unknownCountry'));
          }

          console.log(
            `[LocationSettings] Manuális hely beállítása: ${countryObj.name} (${country})`,
          ); // DEBUG

          // Város nélkül küldjük be - csak ország
          const success = await locationProvider.setManualLocation(
            countryObj.name,
            country,
            undefined, // Nincs város paraméter
          );

          if (!success) {
            throw new Error(t('locationSettings.alerts.failedSetLocation'));
          }

          console.log(`[LocationSettings] Manuális hely sikeresen beállítva`); // DEBUG
          break;
        }

        case 'geo': {
          console.log(
            `[LocationSettings] GPS helymeghatározás indítása, pontosság: ${highAccuracy}`,
          ); // DEBUG

          // GPS helymeghatározás aktiválása a beállított pontosságnak megfelelően
          const success = await locationProvider.setGeoLocation(highAccuracy);

          if (!success) {
            throw new Error(t('locationSettings.alerts.failedGPS'));
          }

          console.log(`[LocationSettings] GPS helymeghatározás sikeres`); // DEBUG
          break;
        }

        case 'browser': {
          console.log(`[LocationSettings] Böngésző alapú helymeghatározás indítása`); // DEBUG

          // Browser alapú helymeghatározás aktiválása
          const success = await locationProvider.setBrowserLanguageLocation();

          if (!success) {
            throw new Error(t('locationSettings.alerts.failedBrowser'));
          }

          console.log(`[LocationSettings] Böngésző alapú helymeghatározás sikeres`); // DEBUG
          break;
        }
      }

      // Helyadatok tárolási beállításainak mentése
      localStorage.setItem('newsx_save_location', saveHistory.toString());
      // Aktív helymeghatározási mód mentése
      localStorage.setItem('newsx_location_mode', locationType);
      console.log(`[LocationSettings] Beállítások mentve, saveHistory: ${saveHistory}`); // DEBUG

      setSaveStatus('success');
    } catch (error) {
      console.error('[LocationSettings] Hiba a helyadatok mentése közben:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [locationType, country, highAccuracy, saveHistory]);

  // Helyelőzmény elem kiválasztása
  const selectHistoryItem = useCallback(
    (location: { country: string; countryCode: string; city?: string }) => {
      setLocationType('manual');
      setCountry(location.countryCode);
      setCity(location.city || '');
    },
    [],
  );

  // Helyelőzmények törlése
  const clearHistory = useCallback(() => {
    try {
      // Töröljük az előzményeket a localStorage-ból (ez a ManualStrategy által használt kulcs)
      localStorage.removeItem('newsx_location_history');
      // Frissítjük a komponens állapotát is
      setLocationHistory([]);
      console.log('Helyelőzmények sikeresen törölve');
    } catch (error) {
      console.error('Hiba az előzmények törlésekor:', error);
    }
  }, []);

  // React-Select komponenshez stílusok - típusos verzió
  const selectStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
    control: (baseStyles: CSSObjectWithLabel, _state: ControlProps<OptionType, false>) => ({
      ...baseStyles,
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      height: '32px',
      minHeight: '32px',
      fontSize: '0.9rem',
    }),
    valueContainer: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      height: '32px',
      padding: '0 8px',
    }),
    input: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      margin: '0',
      padding: '0',
    }),
    indicatorsContainer: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      height: '30px',
    }),
    dropdownIndicator: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      padding: '6px',
    }),
    clearIndicator: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      padding: '6px',
    }),
    menu: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      backgroundColor: '#1a1a1a',
    }),
    menuList: (baseStyles: CSSObjectWithLabel, _state: MenuListProps<OptionType, false>) => ({
      ...baseStyles,
      // Itt a dropdown maximális magassága - ezzel tudjuk szabályozni a megjelenő országlista doboz magasságát
      maxHeight: '150px',
    }),
    option: (baseStyles: CSSObjectWithLabel, state: OptionProps<OptionType, false>) => ({
      ...baseStyles,
      fontSize: '0.9rem',
      padding: '5px 12px',
      backgroundColor: state.isFocused
        ? '#333333' // Hover állapot háttér
        : state.isSelected
          ? '#444444' // Kiválasztott elem háttér
          : '#1a1a1a', // Alapértelmezett háttér
      color: '#ffffff', // Fehér szöveg minden állapotban
      ':active': {
        backgroundColor: '#444444', // Kattintáskor
      },
    }),
    singleValue: (baseStyles: CSSObjectWithLabel) => ({
      ...baseStyles,
      color: 'var(--color-text)',
    }),
  };

  // Opciók elkészítése React-Select-hez
  const continentOptions: OptionType[] = CONTINENTS.map((continent) => ({
    value: continent.code,
    label: continent.name,
  }));

  const countryOptions: OptionType[] = selectedContinent
    ? CONTINENTS.find((c) => c.code === selectedContinent)?.countries.map((country) => ({
        value: country.code,
        label: country.name,
      })) || []
    : [];

  return (
    <div>
      <h3>{t('locationSettings.title')}</h3>

      {/* 1. Helymeghatározás mód választó */}
      <div className={styles.settingGroup}>
        <h4>{t('locationSettings.locationMethod.title')}</h4>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="locationType"
              value="manual"
              checked={locationType === 'manual'}
              onChange={() => setLocationType('manual')}
            />
            <span>{t('locationSettings.locationMethod.manual')}</span>
          </label>

          <label>
            <input
              type="radio"
              name="locationType"
              value="geo"
              checked={locationType === 'geo'}
              onChange={() => setLocationType('geo')}
            />
            <span>{t('locationSettings.locationMethod.gps')}</span>
          </label>

          <label>
            <input
              type="radio"
              name="locationType"
              value="browser"
              checked={locationType === 'browser'}
              onChange={() => setLocationType('browser')}
            />
            <span>{t('locationSettings.locationMethod.browser')}</span>
          </label>
        </div>
      </div>

      {/* 2. Kontinens választó React-Select-tel */}
      {locationType === 'manual' && (
        <div className={styles.settingGroup}>
          <h4>{t('locationSettings.continentSelector.title')}</h4>
          <Select<OptionType>
            className={styles.reactSelect}
            options={continentOptions}
            value={continentOptions.find((option) => option.value === selectedContinent)}
            onChange={(option) => {
              const value = option ? option.value : '';
              setSelectedContinent(value);
              setCountry(''); // Reset ország kiválasztás új kontinens esetén
            }}
            styles={selectStyles}
            placeholder={t('locationSettings.continentSelector.placeholder')}
          />
        </div>
      )}

      {/* 3. Országválasztó React-Select-tel - KISEBB MAGASSÁGGAL */}
      {locationType === 'manual' && selectedContinent && (
        <div className={styles.settingGroup}>
          <h4>{t('locationSettings.countrySelector.title')}</h4>
          <Select<OptionType>
            className={styles.reactSelect}
            options={countryOptions}
            value={countryOptions.find((option) => option.value === country)}
            onChange={(option) => {
              const value = option ? option.value : '';
              setCountry(value);
            }}
            styles={selectStyles}
            placeholder={t('locationSettings.countrySelector.placeholder')}
            // A legördülő menü maximális magassága - ezt változtathatod
            maxMenuHeight={150}
          />
        </div>
      )}

      {/* 4. Városválasztó (opcionális, manuális módnál) */}
      {/*
      {locationType === 'manual' && country && (
        <div className={styles.settingGroup}>
          <h4>Enter City (optional)</h4>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="E.g. Budapest"
            className={styles.select}
          />
        </div>
      )}
      */}
      {/* GPS beállítások */}
      {locationType === 'geo' && (
        <div className={styles.settingGroup}>
          <h4>{t('locationSettings.gpsSettings.title')}</h4>
          <label className={styles.switchLabel}>
            {t('locationSettings.gpsSettings.highAccuracy')}
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={highAccuracy}
                onChange={(e) => setHighAccuracy(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </label>
          <p className={styles.hint}>
            {t('locationSettings.gpsSettings.note')}
          </p>
        </div>
      )}

      {/* Adattárolási beállítások */}
      <div className={styles.settingGroup}>
        <h4>{t('locationSettings.dataStorage.title')}</h4>
        <label className={styles.switchLabel}>
          {t('locationSettings.dataStorage.rememberData')}
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={saveHistory}
              onChange={(e) => setSaveHistory(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </label>
      </div>

      {/* Korábbi helyek listája - CSAK akkor jelenik meg, ha manuális módot használunk */}
      {locationHistory.length > 0 && locationType === 'manual' && (
        <div className={styles.settingGroup}>
          <h4>{t('locationSettings.previousLocations.title')}</h4>
          <div className={styles.historyList}>
            {locationHistory.map((location, index) => (
              <div key={index} className={styles.historyItem}>
                <span>
                  {location.country}
                  {location.city ? `, ${location.city}` : ''}
                </span>
                <button onClick={() => selectHistoryItem(location)} className={styles.button}>
                  {t('locationSettings.previousLocations.useButton')}
                </button>
              </div>
            ))}
          </div>
          <button onClick={clearHistory} className={styles.button}>
            {t('locationSettings.previousLocations.clearHistory')}
          </button>
        </div>
      )}

      {/* Mentés gomb és állapot */}
      <div className={styles.actions}>
        {saveStatus === 'success' && <span className={styles.saveSuccess}>{t('locationSettings.actions.success')}</span>}
        {saveStatus === 'error' && <span className={styles.saveError}>{t('locationSettings.actions.error')}</span>}

        <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
          {isSaving ? t('locationSettings.actions.saving') : t('locationSettings.actions.save')}
        </button>
      </div>
    </div>
  );
};
