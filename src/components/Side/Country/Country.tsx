// src/components/Side/Country/Country.tsx (Javított verzió)

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import sideStyles from '../Side.module.css';
import styles from './Country.module.css';
import toggleStyles from '../FilterToggles/SideToggleButtons.module.css';
import { traceDataFlow } from '../../../utils/debugTools/debugTools';
import { apiClient } from '../../../apiclient/apiClient';
import { VideoChannel } from '../../../backend/api/routes/videoData/videoData';

// ... (interface és useVideoChannelsByLetter hook változatlan)
interface CountryProps {
    selectedCountry: string | null;
    onCountrySelect: (country: string | null) => void;
    selectedContinent?: string | null;
    activeSearchMode?: 'countries' | 'source' | 'channel';
    onSearchModeChange?: (searchMode: 'countries' | 'source' | 'channel') => void;
    contentType?: 'text' | 'video' | 'both';
    onSearchActiveChange?: (isActive: boolean) => void;
    onSearchResultsChange?: (results: string[]) => void;
    onActiveLetterChange?: (letter: string | null) => void;
}

function useVideoChannelsByLetter() {
    const [videoChannelsByLetter, setVideoChannelsByLetter] = useState<{ [letter: string]: { country: string; channels: VideoChannel[] }[] }>({});
    useEffect(() => {
        apiClient.getVideoCountries().then((result) => {
            // Itt alakítsd át a result-ot a megfelelő struktúrára
            setVideoChannelsByLetter(result as { [letter: string]: { country: string; channels: VideoChannel[]; }[] });
        });
    }, []);
    return videoChannelsByLetter;
}

export const Country: React.FC<CountryProps> = React.memo(
  ({ 
    selectedCountry, 
    onCountrySelect, 
    selectedContinent, 
    activeSearchMode = 'countries', 
    onSearchModeChange = () => {}, 
    contentType = 'both',
    onSearchActiveChange = () => {},
    onSearchResultsChange = () => {},
    onActiveLetterChange = () => {}
  }) => {
    // ... (state-ek és ref-ek változatlanok)
    const [isExpanded, setIsExpanded] = useState(false);
    const [countries, setCountries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const alphabetIndexRef = useRef<HTMLDivElement>(null);
    const letterClickHandledRef = useRef(false);
    const { t } = useTranslation();

    const sampleCountries = React.useMemo(
      () => [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
        'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
        'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
        'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
        'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
        'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Republic of the Congo',
        'Democratic Republic of the Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
        'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
        'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
        'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
        'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary',
        'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
        'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
        'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
        'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
        'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
        'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
        'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
        'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
        'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
        'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
        'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
        'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
        'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
        'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
        'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
        'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
        'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
        'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Western Sahara',
        'Yemen', 'Zambia', 'Zimbabwe', 'Ivory Coast',
      ],
      [],
    );

    useEffect(() => {
        setLoading(true);
        const timeoutId = setTimeout(() => {
            setCountries(sampleCountries);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [sampleCountries]);

    // ... (useEffect hook-ok változatlanok)
    useEffect(() => {
        const storedCountry = localStorage.getItem('selectedCountry');
        if (storedCountry) {
            console.log(`[Country] Korábban elmentett ország: ${storedCountry} (nem aktiváljuk automatikusan)`);
        }
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            localStorage.setItem('selectedCountry', selectedCountry);
        } else {
            localStorage.removeItem('selectedCountry');
        }
    }, [selectedCountry]);

    useEffect(() => {
        traceDataFlow('Country.props', { selectedCountry, selectedContinent, countriesCount: countries.length });
    }, [selectedCountry, selectedContinent, countries.length]);

    const alphabet = React.useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

    const countryGroups = React.useMemo(() => {
        const groups: { [key: string]: string[] } = {};
        alphabet.forEach(letter => { groups[letter] = []; });
        countries.forEach(country => {
            const firstLetter = country.charAt(0).toUpperCase();
            if (groups[firstLetter]) {
                groups[firstLetter].push(country);
            }
        });
        return groups;
    }, [countries, alphabet]);

    const activeLetters = React.useMemo(() => {
        return Object.keys(countryGroups).filter(letter => countryGroups[letter].length > 0);
    }, [countryGroups]);

    const handleLetterClick = React.useCallback((e: React.MouseEvent, letter: string) => {
        e.stopPropagation();
        letterClickHandledRef.current = true;
        setSelectedLetter(prev => (prev === letter ? null : letter));
        setTimeout(() => { letterClickHandledRef.current = false; }, 50);
    }, []);
    
    useEffect(() => { if (!isExpanded) setSelectedLetter(null); }, [isExpanded]);
    useEffect(() => { onSearchActiveChange(isExpanded && selectedLetter !== null); }, [isExpanded, selectedLetter, onSearchActiveChange]);
    useEffect(() => { onSearchResultsChange(selectedLetter ? countryGroups[selectedLetter] || [] : []); }, [selectedLetter, countryGroups, onSearchResultsChange]);
    useEffect(() => { onActiveLetterChange(selectedLetter); }, [selectedLetter, onActiveLetterChange]);

    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (alphabetIndexRef.current) {
            alphabetIndexRef.current.scrollLeft += e.deltaY || e.deltaX;
        }
    }, []);

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!alphabetIndexRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - alphabetIndexRef.current.offsetLeft);
        setScrollLeft(alphabetIndexRef.current.scrollLeft);
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !alphabetIndexRef.current) return;
        e.preventDefault();
        const x = e.pageX - alphabetIndexRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        alphabetIndexRef.current.scrollLeft = scrollLeft - walk;
    };
    
    const videoChannelsByLetter = useVideoChannelsByLetter();
    
    const videoCountries = React.useMemo(() => {
        const countriesSet = new Set<string>();
        Object.values(videoChannelsByLetter).forEach((countryList: { country: string; channels: VideoChannel[] }[]) => {
            countryList.forEach(countryObj => {
                if (countryObj.channels?.length > 0) {
                    countriesSet.add(countryObj.country);
                }
            });
        });
        return Array.from(countriesSet).sort();
    }, [videoChannelsByLetter]);

    // ✅ JAVÍTÁS: baseList -> const
    const filteredTextCountries = React.useMemo(() => {
        const baseList = countries;
        if (!selectedLetter) return baseList;
        return baseList.filter(country => country.charAt(0).toUpperCase() === selectedLetter);
    }, [countries, selectedLetter]);

    // ✅ JAVÍTÁS: baseList -> const
    const filteredVideoCountries = React.useMemo(() => {
        const baseList = videoCountries;
        if (!selectedLetter) return baseList;
        return baseList.filter(country => country.charAt(0).toUpperCase() === selectedLetter);
    }, [videoCountries, selectedLetter]);

    // ✅ JAVÍTÁS: String() kasztolás eltávolítva
    const renderCountryList = React.useMemo(() => {
        if (!selectedLetter) return null;
        if (loading) return <div>{t('country.loading', 'Loading countries...')}</div>;
        
        const list = contentType === 'video' ? filteredVideoCountries : filteredTextCountries;
        
        return (
            <ul className={styles.countryList}>
                {list.length === 0 ? (
                    <li>{t('country.noCountries', 'No countries found')}</li>
                ) : (
                    list.map(country => (
                        <li
                            key={country}
                            className={selectedCountry === country ? sideStyles.active : ''}
                            onClick={e => {
                                e.stopPropagation();
                                const newCountry = selectedCountry === country ? null : country;
                                onCountrySelect(newCountry);
                            }}
                        >
                            {t('country.' + country.replace(/[\s-.'éáíóöőúüű]/g, (match) => {
                                const replacements: { [key: string]: string } = {
                                    ' ': '', '-': '', '.': '', "'": '', 'é': 'e', 'á': 'a', 'í': 'i',
                                    'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u'
                                };
                                return replacements[match] || '';
                            }), country)}
                        </li>
                    ))
                )}
            </ul>
        );
    }, [selectedLetter, loading, filteredTextCountries, filteredVideoCountries, selectedCountry, onCountrySelect, t, contentType]);
    
    // ✅ JAVÍTÁS: Egyszerűsített onClick logika
    const renderSearchModeToggles = () => (
        <div className={toggleStyles.toggleContainer}>
            <h4 className={styles.sectionTitle}>{t('searchMode.title', 'Search Mode')}</h4>
            <div className={toggleStyles.toggleGroup}>
                <button
                    className={`${toggleStyles.toggleButton} ${activeSearchMode === 'countries' ? toggleStyles.active : ''}`}
                    onClick={() => {
                        onSearchModeChange('countries');
                        if (activeSearchMode !== 'countries') {
                            setIsExpanded(true);
                        } else {
                            setIsExpanded(prev => !prev);
                        }
                    }}
                    title={t('searchMode.countryTitle', 'Search by countries')}
                    type="button"
                >
                    {t('searchMode.country', 'Countries')}
                </button>
                <button
                    className={`${toggleStyles.toggleButton} ${toggleStyles.locked}`}
                    onClick={() => alert('🔒 Locked - Source filtering feature is in development!')}
                    title="🔒 Locked - Source filtering in development"
                    type="button"
                >
                    {t('searchMode.source', 'Source')}
                </button>
                <button
                    className={`${toggleStyles.toggleButton} ${toggleStyles.locked}`}
                    onClick={() => alert('🔒 Locked - Channel filtering feature is in development!')}
                    title="🔒 Locked - Channel filtering in development"
                    type="button"
                >
                    {t('searchMode.channel', 'Channel')}
                </button>
            </div>
        </div>
    );

    return (
      <div className={sideStyles.sidebarSection}>
        {renderSearchModeToggles()}

        {activeSearchMode === 'countries' && isExpanded && (
          <>
            <div className={styles.alphabetContainer}>
                <div
                    className={styles.alphabetIndex}
                    ref={alphabetIndexRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                >
                    {alphabet.map(letter => (
                        <div
                            key={letter}
                            className={`${styles.letterBtn} ${!activeLetters.includes(letter) && styles.inactive} ${selectedLetter === letter && styles.active}`}
                            onClick={e => {
                                if (activeLetters.includes(letter)) {
                                    handleLetterClick(e, letter);
                                }
                            }}
                        >
                            {letter}
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.countryListContainer}>
                {renderCountryList}
            </div>
          </>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => (
    prevProps.selectedCountry === nextProps.selectedCountry &&
    prevProps.selectedContinent === nextProps.selectedContinent &&
    prevProps.onCountrySelect === nextProps.onCountrySelect &&
    prevProps.activeSearchMode === nextProps.activeSearchMode &&
    prevProps.onSearchModeChange === nextProps.onSearchModeChange
  ),
);