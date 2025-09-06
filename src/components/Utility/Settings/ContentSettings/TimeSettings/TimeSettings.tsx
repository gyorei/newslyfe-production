import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TimeSettings.module.css';
import { useStorage } from '../../../../../hooks/useStorage';
import { timeSettingsBridge, MAX_AGE_HOURS_PREFERENCE_KEY } from './TimeSettingsBridge';

export const TimeSettings: React.FC = () => {
  const { t } = useTranslation();
  // Maximum news age in hours (1-24 hours) - REDUCED FROM 168h TO 24h
  const [maxAgeHours, setMaxAgeHours] = useState<number>(24); // Default: 24 hours
  // Custom time input state
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customTimeValue, setCustomTimeValue] = useState<string>('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // useStorage hook
  const { getUserPreference, saveUserPreference } = useStorage();

  // Available time interval options in hours - UPDATED FOR 24h MAX + 2h ADDED
  const timeOptions = React.useMemo(
    () => [
      { hours: 1, label: '1h' },
      { hours: 2, label: '2h' }, // NEW: Added 2h option
      { hours: 6, label: '6h' },
      { hours: 12, label: '12h' },
      { hours: 24, label: '24h' }, // CHANGED: Was "1 nap", now "24h"
      // REMOVED: 48h (2 nap), 72h (3 nap), 168h (1 hét)
    ],
    [],
  );

  // Inicializálás localStorage-ból és IndexedDB-ből + MIGRATION LOGIC
  useEffect(() => {
    const loadTimePreferences = async () => {
      try {
        // Maximális kor beállítás betöltése a DataManager-ből
        const maxAgePref = await getUserPreference(MAX_AGE_HOURS_PREFERENCE_KEY);
        if (maxAgePref && maxAgePref.value !== undefined) {
          let ageValue = Number(maxAgePref.value);

          // MIGRATION: 168h → 24h automatic conversion
          if (ageValue > 24) {
            console.log(`[TimeSettings] MIGRATION: Converting ${ageValue}h to 24h maximum`);
            ageValue = 24;

            // Save migrated value
            await saveUserPreference({
              id: MAX_AGE_HOURS_PREFERENCE_KEY,
              value: ageValue,
              updatedAt: Date.now(),
              type: 'number',
            });
            localStorage.setItem('maxAgeHours', ageValue.toString());
          }

          setMaxAgeHours(ageValue);

          // Check if saved value exists in timeOptions list
          const isStandardOption = timeOptions.some((option) => option.hours === ageValue);
          if (!isStandardOption) {
            setIsCustomTime(true);
            setCustomTimeValue(ageValue.toString());
          }
        } else {
          // If preference not set, try loading from localStorage
          const savedMaxAge = localStorage.getItem('maxAgeHours');
          if (savedMaxAge) {
            let ageValue = Number(savedMaxAge);

            // MIGRATION: localStorage 168h → 24h conversion
            if (ageValue > 24) {
              console.log(
                `[TimeSettings] MIGRATION: Converting localStorage ${ageValue}h to 24h maximum`,
              );
              ageValue = 24;
            }

            setMaxAgeHours(ageValue);

            // Migrate: save in new format
            await saveUserPreference({
              id: MAX_AGE_HOURS_PREFERENCE_KEY,
              value: ageValue,
              updatedAt: Date.now(),
              type: 'number',
            });
            localStorage.setItem('maxAgeHours', ageValue.toString());

            const isStandardOption = timeOptions.some((option) => option.hours === ageValue);
            if (!isStandardOption) {
              setIsCustomTime(true);
              setCustomTimeValue(ageValue.toString());
            }
          }
        }
      } catch (error) {
        console.error(t('timeSettings.errors.loadError'), error);
        setValidationMessage(t('timeSettings.errors.loadingErrorMessage'));
      }
    };

    loadTimePreferences();
  }, [getUserPreference, saveUserPreference, timeOptions]);

  // Validation function - UPDATED FOR 24h MAXIMUM
  const validateTimeValue = (value: number): string | null => {
    if (isNaN(value) || value < 1 || value > 24) {
      // CHANGED: max 168 → 24
      return t('timeSettings.errors.rangeError');
    }
    if (!Number.isInteger(value)) {
      return t('timeSettings.errors.wholeNumberError');
    }
    return null;
  };

  // Time setting handler - MIGRATION LOGIC
  const handleTimeOptionChange = async (hours: number) => {
    const validation = validateTimeValue(hours);
    if (validation) {
      setValidationMessage(validation);
      return;
    }

    setValidationMessage(null);
    setMaxAgeHours(hours);
    setIsCustomTime(false);
    setCustomTimeValue('');

    try {
      // Mentés DataManager-rel
      await saveUserPreference({
        id: MAX_AGE_HOURS_PREFERENCE_KEY,
        value: hours,
        updatedAt: Date.now(),
        type: 'number',
      });
      // Mentés localStorage-ba a kompatibilitás érdekében
      localStorage.setItem('maxAgeHours', hours.toString());

      // ÚJ: Azonnali értesítés a Panel-nek (mint a hírek számánál)
      timeSettingsBridge.emit(MAX_AGE_HOURS_PREFERENCE_KEY, hours);

      console.log(`[TimeSettings] Maximum news age set to: ${hours} hours`);
    } catch (error) {
      console.error(t('timeSettings.errors.saveError'), error);
      setValidationMessage(t('timeSettings.errors.savingErrorMessage'));
    }
  };

  // Custom time value handler - UPDATED FOR 24h VALIDATION
  const handleCustomTimeChange = (value: string) => {
    setCustomTimeValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const validation = validateTimeValue(numValue);
      setValidationMessage(validation);

      // SOFT LIMIT WARNING: Show warning if >24h but allow input
      if (numValue > 24) {
        setValidationMessage(t('timeSettings.errors.maxHoursWarning'));
      }
    }
  };

  // Apply custom time - HARD LIMIT ON SAVE
  const applyCustomTime = async () => {
    const numValue = parseInt(customTimeValue, 10);

    // HARD LIMIT: Block saving if >24h
    if (numValue > 24) {
      setValidationMessage(t('timeSettings.errors.maxHoursError'));
      return;
    }

    const validation = validateTimeValue(numValue);
    if (validation) {
      setValidationMessage(validation);
      return;
    }

    setValidationMessage(null);
    setMaxAgeHours(numValue);

    try {
      // Mentés DataManager-rel
      await saveUserPreference({
        id: MAX_AGE_HOURS_PREFERENCE_KEY,
        value: numValue,
        updatedAt: Date.now(),
        type: 'number',
      });
      // Mentés localStorage-ba a kompatibilitás érdekében
      localStorage.setItem('maxAgeHours', numValue.toString());

      // ÚJ: Azonnali értesítés a Panel-nek (mint a hírek számánál)
      timeSettingsBridge.emit(MAX_AGE_HOURS_PREFERENCE_KEY, numValue);

      console.log(`[TimeSettings] Custom maximum news age set to: ${numValue} hours`);
    } catch (error) {
      console.error(t('timeSettings.errors.saveError'), error);
      setValidationMessage(t('timeSettings.errors.savingErrorMessage'));
    }
  };

  // Egyéni idő mód váltása
  const toggleCustomTimeMode = () => {
    setIsCustomTime(!isCustomTime);
    setValidationMessage(null);
    if (!isCustomTime) {
      setCustomTimeValue(maxAgeHours.toString());
    }
  };

  return (
    <div className={styles.timeSettings}>
      <h3 className={styles.title}>{t('timeSettings.title')}</h3>
      <p className={styles.description}>
        {t('timeSettings.description')}
      </p>
      <div className={styles.optionsContainer}>
        {timeOptions.map((option) => (
          <button
            key={option.hours}
            className={`${styles.timeOption} ${
              !isCustomTime && maxAgeHours === option.hours ? styles.active : ''
            }`}
            onClick={() => handleTimeOptionChange(option.hours)}
            disabled={isCustomTime}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className={styles.customTimeSection}>
        <button
          className={`${styles.customTimeToggle} ${isCustomTime ? styles.active : ''}`}
          onClick={toggleCustomTimeMode}
        >
          {t('timeSettings.customDuration')}
        </button>

        {isCustomTime && (
          <div className={styles.customTimeInput}>
            <input
              type="number"
              min="1"
              max="24"
              value={customTimeValue}
              onChange={(e) => handleCustomTimeChange(e.target.value)}
              placeholder={t('timeSettings.placeholder')}
              className={`${styles.timeInput} ${validationMessage ? styles.error : ''}`}
            />
            <span className={styles.timeUnit}>{t('timeSettings.hoursUnit')}</span>
            <button
              onClick={applyCustomTime}
              className={styles.applyButton}
              disabled={!customTimeValue || !!validationMessage}
            >
              {t('timeSettings.apply')}
            </button>
          </div>
        )}
      </div>
      {validationMessage && <div className={styles.validationMessage}>{validationMessage}</div>}
      <div className={styles.currentSetting}>
        {t('timeSettings.currentSetting')} <strong>{maxAgeHours} {t('timeSettings.hoursUnit')}</strong>
        {maxAgeHours === 24 && ` ${t('timeSettings.oneDay')}`}
      </div>
    </div>
  );
};
