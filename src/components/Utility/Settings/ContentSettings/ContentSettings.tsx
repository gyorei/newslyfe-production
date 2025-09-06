// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
// - ne vezess be komplexitást, amíg nincs rá valódi igény.
// nem törlünk ki semmit csak kommentáljuk ki ami nem kell!!! ha van ilyen!!

// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
// - ne vezess be komplexitást, amíg nincs rá valódi igény.
// nem törlünk ki semmit csak kommentáljuk ki ami nem kell!!! ha van ilyen!!
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ContentSettings.module.css';
import PerformanceWarning from '../../../PerformanceWarning/PerformanceWarning';
import { useStorage } from '../../../../hooks/useStorage';
import { settingsBridge, ITEMS_PER_PAGE_PREFERENCE_KEY } from './ContentSettingsPanelBridge';
import { TimeSettings } from './TimeSettings';
// import { DataManagement } from './DataManagement/DataManagement'; // ÚJ IMPORT

// Konstansok a duplikált string literálok helyett
const HORIZONTAL_SCROLLER_PREFERENCE_KEY = 'user_showHorizontalScroller';
const LOCAL_STORAGE_SHOW_PREVIEWS_KEY = 'showArticlePreviews';
const LOCAL_STORAGE_HIDE_WARNING_KEY = 'hidePerformanceWarning';

export const ContentSettings: React.FC = () => {
  const { t } = useTranslation();
  // Hírek számának beállítása localStorage-ban tárolva
  const [newsLimit, setNewsLimit] = useState<number>(50);
  // Cikkek előnézeteinek megjelenítése (képek, leírások a hírlistában)
  const [showPreviews, setShowPreviews] = useState<boolean>(true);
  // Egyéni érték megadásának állapota
  const [isCustom, setIsCustom] = useState<boolean>(false);
  // Egyéni érték
  const [customValue, setCustomValue] = useState<string>('');
  // Teljesítmény figyelmeztetés állapota
  const [showPerformanceWarning, setShowPerformanceWarning] = useState<boolean>(false);
  // Képnélküli hírek elrendezésének beállítása
  const [noImageLayout, setNoImageLayout] = useState<string>('card'); // 'card' vagy 'horizontal'
  // Konténerenkénti hír darabszám (csak horizontálisnál)
  const [containerNewsCount, setContainerNewsCount] = useState<number>(10);
  // Új: Kiemelt hírsáv megjelenítése
  const [showHorizontalScroller, setShowHorizontalScroller] = useState<boolean>(false);
  const containerCountOptions = [5, 10, 15, 20];
  // Új: Validációs üzenet
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // useStorage hook
  const { getUserPreference, saveUserPreference } = useStorage();

  // Hírek számának beállításai
  // Elérhető hírlimit opciók - useMemo-val optimalizálva
  const limitOptions = React.useMemo(() => [20, 50, 100, 200, 300, 500, 1000], []);

  // Inicializálás localStorage-ból és IndexedDB-ből
  useEffect(() => {
    try {
      // Kiemelt hírsáv és hírlimit beállítás betöltése a DataManager-ből
      const loadUserPreferences = async () => {
        try {
          // Horizontális scroll beállítás betöltése
          const horizontalScrollerPref = await getUserPreference(
            HORIZONTAL_SCROLLER_PREFERENCE_KEY,
          );
          if (horizontalScrollerPref && horizontalScrollerPref.value !== undefined) {
            setShowHorizontalScroller(Boolean(horizontalScrollerPref.value));
          }

          // ÚJ: Oldalankénti hírek számának betöltése
          const itemsPerPagePref = await getUserPreference(ITEMS_PER_PAGE_PREFERENCE_KEY);
          if (itemsPerPagePref && itemsPerPagePref.value !== undefined) {
            const limitValue = Number(itemsPerPagePref.value);
            setNewsLimit(limitValue);

            // Ellenőrizzük, hogy a mentett érték szerepel-e a limitOptions listában
            if (!limitOptions.includes(limitValue)) {
              setIsCustom(true);
              setCustomValue(limitValue.toString());
            }
          } else {
            // Ha még nincs beállítva a preferencia, akkor is olvassuk be
            // a régi localStorage értéket a zökkenőmentes migráció érdekében
            const savedLimit = localStorage.getItem('newsLimit');
            if (savedLimit) {
              const limitValue = Number(savedLimit);
              setNewsLimit(limitValue);

              // Migrate: mentsük el az új formátumban is
              await saveUserPreference({
                id: ITEMS_PER_PAGE_PREFERENCE_KEY,
                value: limitValue,
                updatedAt: Date.now(),
                type: 'number',
              });

              // Ellenőrizzük, hogy a mentett érték szerepel-e a limitOptions listában
              if (!limitOptions.includes(limitValue)) {
                setIsCustom(true);
                setCustomValue(limitValue.toString());
              }
            }
          }

          // Többi beállítás betöltése localStorage-ból
          const savedShowPreviews = localStorage.getItem(LOCAL_STORAGE_SHOW_PREVIEWS_KEY);
          if (savedShowPreviews !== null) {
            setShowPreviews(savedShowPreviews === 'true');
          }

          const savedNoImageLayout = localStorage.getItem('noImageLayout');
          if (savedNoImageLayout === 'card' || savedNoImageLayout === 'horizontal') {
            setNoImageLayout(savedNoImageLayout);
          }
          const savedContainerNewsCount = localStorage.getItem('containerNewsCount');
          if (savedContainerNewsCount && !isNaN(Number(savedContainerNewsCount))) {
            setContainerNewsCount(Number(savedContainerNewsCount));
          }
        } catch (error) {
          console.error('Hiba a felhasználói beállítások betöltésekor:', error);
        }
      };

      loadUserPreferences();
    } catch (error) {
      console.error('Hiba a beállítások betöltésekor:', error);
    }
  }, [getUserPreference, limitOptions, saveUserPreference]); // saveUserPreference hozzáadva

  const handleLimitChange = async (newLimit: number) => {
    // Nagy érték esetén figyelmeztetés mutatása, ha még nem lett elrejtve
    if (newLimit > 500 && !localStorage.getItem(LOCAL_STORAGE_HIDE_WARNING_KEY)) {
      setShowPerformanceWarning(true);
    }

    setNewsLimit(newLimit);
    setIsCustom(false);

    try {
      // Korábbi localStorage mentés megtartása a visszafelé kompatibilitásért
      localStorage.setItem('newsLimit', newLimit.toString());

      // ÚJ: Mentés a DataManager-rel
      await saveUserPreference({
        id: ITEMS_PER_PAGE_PREFERENCE_KEY,
        value: newLimit,
        updatedAt: Date.now(),
        type: 'number', // ÚJ: Típus megadása
      });

      // ÚJ: Esemény kiváltása a hídon keresztül
      settingsBridge.emit(ITEMS_PER_PAGE_PREFERENCE_KEY, newLimit);

      console.log(`[ContentSettings] Oldalankénti hírek száma beállítva: ${newLimit}`);
    } catch (error) {
      console.error('Hiba a beállítások mentésekor:', error);
    }
  };

  // Kiemelt hírsáv beállításának kezelése
  const handleShowHorizontalScrollerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowHorizontalScroller(newValue);
    try {
      // Mentés DataManager-rel az IndexedDB-be
      await saveUserPreference({
        id: HORIZONTAL_SCROLLER_PREFERENCE_KEY,
        value: newValue,
        updatedAt: Date.now(),
        type: 'boolean', // ÚJ: Típus megadása
      });
      console.log(`[ContentSettings] Kiemelt hírsáv megjelenítése: ${newValue}`);
    } catch (error) {
      console.error('Hiba a beállítások mentésekor:', error);
    }
  };

  const handleShowPreviewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowPreviews(newValue);
    try {
      localStorage.setItem(LOCAL_STORAGE_SHOW_PREVIEWS_KEY, newValue.toString());
      console.log(`[ContentSettings] Cikkek előnézeteinek megjelenítése: ${newValue}`);
    } catch (error) {
      console.error('Hiba a beállítások mentésekor:', error);
    }
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);

    // Validáció minden bevitelnél
    if (inputValue) {
      const parsedValue = parseInt(inputValue, 10);

      if (isNaN(parsedValue) || parsedValue <= 0) {
        setValidationMessage(t('contentSettings.validation.positiveNumber'));
      } else if (parsedValue < 5) {
        setValidationMessage(t('contentSettings.validation.minimum'));
      } else if (parsedValue > 2000) {
        setValidationMessage(t('contentSettings.validation.maximum'));
      } else {
        // Érvényes érték esetén töröljük a validációs üzenetet
        setValidationMessage(null);
      }
    } else {
      // Üres mező esetén töröljük a validációs üzenetet
      setValidationMessage(null);
    }
  };

  const handleCustomValueSubmit = async () => {
    const parsedValue = parseInt(customValue, 10);

    // Ellenőrizzük, hogy érvényes-e az érték
    if (!isNaN(parsedValue) && parsedValue >= 5 && parsedValue <= 2000) {
      // Nagy érték esetén figyelmeztetés mutatása, ha még nem lett elrejtve
      if (parsedValue > 500 && !localStorage.getItem(LOCAL_STORAGE_HIDE_WARNING_KEY)) {
        setShowPerformanceWarning(true);
      }

      setNewsLimit(parsedValue);
      setIsCustom(false); // Opcionális: bezárjuk az egyéni mezőt sikeres beállítás után

      try {
        // Korábbi localStorage mentés megtartása a visszafelé kompatibilitásért
        localStorage.setItem('newsLimit', parsedValue.toString());

        // Mentés a DataManager-rel
        await saveUserPreference({
          id: ITEMS_PER_PAGE_PREFERENCE_KEY,
          value: parsedValue,
          updatedAt: Date.now(),
          type: 'number', // ÚJ: Típus megadása
        });

        // Esemény kiváltása a hídon keresztül
        settingsBridge.emit(ITEMS_PER_PAGE_PREFERENCE_KEY, parsedValue);

        console.log(`[ContentSettings] Egyedi oldalankénti hírlimit beállítva: ${parsedValue}`);
      } catch (error) {
        console.error('Hiba a beállítások mentésekor:', error);
      }
    } else {
      // Ha érvénytelen érték, beállítjuk a megfelelő validációs üzenetet
      if (isNaN(parsedValue) || parsedValue <= 0) {
        setValidationMessage(t('contentSettings.validation.positiveNumber'));
      } else if (parsedValue < 5) {
        setValidationMessage(t('contentSettings.validation.minimum'));
      } else if (parsedValue > 2000) {
        setValidationMessage(t('contentSettings.validation.maximum'));
      }

      console.error(t('contentSettings.validation.invalidCustom'));
    }
  };

  const handleNoImageLayoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNoImageLayout(value);
    localStorage.setItem('noImageLayout', value);
  };

  const handleContainerNewsCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setContainerNewsCount(value);
    localStorage.setItem('containerNewsCount', value.toString());
  };

  // Figyelmeztetés bezárásának kezelése
  const handleCloseWarning = () => {
    setShowPerformanceWarning(false);
    localStorage.setItem(LOCAL_STORAGE_HIDE_WARNING_KEY, 'true');
    console.log('[ContentSettings] Teljesítmény figyelmeztetés elrejtve');
  };

  // Sötét háttér és világos szöveg stílus az option elemekhez
  const darkOptionStyle = {
    backgroundColor: '#333',
    color: 'white',
  };

  return (
    <div>
      <h3>{t('contentSettings.title')}</h3>
      <div className={styles.settingGroup}>
        <label>{t('contentSettings.displayMode.label')}</label>
        <select className={styles.select}>
          <option value="grid" style={darkOptionStyle}>
            {t('contentSettings.displayMode.grid')}
          </option>
          <option value="list" style={darkOptionStyle}>
            {t('contentSettings.displayMode.list')}
          </option>
          <option value="compact" style={darkOptionStyle}>
            {t('contentSettings.displayMode.compact')}
          </option>
        </select>
      </div>
      <div className={styles.settingGroup}>
        <label>{t('contentSettings.sortBy.label')}</label>
        <select className={styles.select}>
          <option value="newest" style={darkOptionStyle}>
            {t('contentSettings.sortBy.newest')}
          </option>
          <option value="popular" style={darkOptionStyle}>
            {t('contentSettings.sortBy.popular')}
          </option>
          <option value="relevance" style={darkOptionStyle}>
            {t('contentSettings.sortBy.relevance')}
          </option>
        </select>
      </div>
      {/* =====================================================
         NEWS COUNT PER PAGE SETTING - ENGLISH LABELS
         ===================================================== */}
      <div className={styles.settingGroup}>
        <label>{t('contentSettings.newsCount.label')}</label>
        <div className={styles.limitButtons}>
          {limitOptions.map((limit) => (
            <button
              key={limit}
              className={`${styles.limitButton} ${!isCustom && newsLimit === limit ? styles.active : ''}`}
              onClick={() => handleLimitChange(limit)}
            >
              {limit}
            </button>
          ))}
          <button
            className={`${styles.limitButton} ${isCustom ? styles.active : ''}`}
            onClick={() => setIsCustom(true)}
          >
            {t('contentSettings.newsCount.custom')}
          </button>
        </div>
        {/* Egyéni érték megadása */}
        {isCustom && (
          <div className={styles.customLimitContainer}>
            <input
              type="number"
              className={`${styles.customLimitInput} ${validationMessage ? styles.errorInput : ''}`}
              value={customValue}
              onChange={handleCustomValueChange}
              placeholder={t('contentSettings.newsCount.customPlaceholder')}
              min="5"
              max="2000"
            />
            <span className={styles.customValueHint}>{t('contentSettings.newsCount.customHint')}</span>
            <button
              className={`${styles.applyButton} ${validationMessage || !customValue ? styles.disabledButton : ''}`}
              onClick={handleCustomValueSubmit}
              disabled={!!validationMessage || !customValue}
            >
              {t('contentSettings.newsCount.apply')}
            </button>

            {validationMessage && <div className={styles.validationError}>{validationMessage}</div>}
          </div>
        )}
        <p className={styles.settingHint}>
          {t('contentSettings.newsCount.hint')}
        </p>
        {/* Teljesítmény figyelmeztetés */}
        <PerformanceWarning
          isVisible={showPerformanceWarning}
          onClose={handleCloseWarning}
          message={t('contentSettings.newsCount.performanceWarning.message')}
          title={t('contentSettings.newsCount.performanceWarning.title')}
        />
      </div>
      {/* ===================================================== 
         HÍREK SZÁMA OLDALANKÉNT BEÁLLÍTÁS VÉGE 
         ===================================================== */}
      {/* Cikkek előnézeteinek megjelenítése húzókapcsolóval */}
      <div className={styles.settingGroup}>
        <label className={styles.switchLabel}>
          {t('contentSettings.previews.label')}
          <span className={styles.switch}>
            <input type="checkbox" checked={showPreviews} onChange={handleShowPreviewsChange} />
            <span className={styles.slider}></span>
          </span>
        </label>
        <p className={styles.settingHint}>
          {t('contentSettings.previews.hint')}
        </p>
      </div>
      {/* ÚJ: Kiemelt hírsáv megjelenítése húzókapcsolóval */}
      <div className={styles.settingGroup}>
        <label className={styles.switchLabel}>
          {t('contentSettings.featuredBar.label')}
          <span className={styles.switch}>
            <input
              type="checkbox"
              checked={showHorizontalScroller}
              onChange={handleShowHorizontalScrollerChange}
            />
            <span className={styles.slider}></span>
          </span>
        </label>
        <p className={styles.settingHint}>
          {t('contentSettings.featuredBar.hint')}
        </p>
      </div>
      {/* Képnélküli hírek elrendezése */}
      <div className={styles.settingGroup}>
        <label>{t('contentSettings.noImageLayout.label')}</label>
        <div>
          <label>
            <input
              type="radio"
              name="noImageLayout"
              value="card"
              checked={noImageLayout === 'card'}
              onChange={handleNoImageLayoutChange}
            />
            {t('contentSettings.noImageLayout.card')}
          </label>
          <label style={{ marginLeft: '1em' }}>
            <input
              type="radio"
              name="noImageLayout"
              value="horizontal"
              checked={noImageLayout === 'horizontal'}
              onChange={handleNoImageLayoutChange}
            />
            {t('contentSettings.noImageLayout.horizontal')}
          </label>
        </div>
        <p className={styles.settingHint}>{t('contentSettings.noImageLayout.hint')}</p>
      </div>
      {/* Konténerenkénti hír darabszám csak horizontálisnál */}
      {noImageLayout === 'horizontal' && (
        <div className={styles.settingGroup}>
          <label>{t('contentSettings.newsPerContainer.label')}</label>
          <select
            className={styles.select}
            value={containerNewsCount}
            onChange={handleContainerNewsCountChange}
          >
            {containerCountOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className={styles.settingHint}>
            {t('contentSettings.newsPerContainer.hint')}
          </p>
        </div>
      )}
      {/* =====================================================
         IDŐBEÁLLÍTÁS (ÚJ RÉSZ)
         A következő rész kezeli az időbeállításokat, mint pl. időzónák, nyári időszámítás stb.
         ===================================================== */}
      <TimeSettings />
      {/* =====================================================
         ADATKEZELÉS ÉS TISZTÍTÁS (ÚJ MODULÁRIS RÉSZ)
         A következő rész az új DataManagement komponensre hivatkozik
         ===================================================== */}
      {/* <DataManagement /> */}

    </div>
  );
};
