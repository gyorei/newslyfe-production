/*
import React from 'react';
import styles from './Continent.module.css';

interface ContinentProps {
  selectedContinent: string | null;
  onContinentSelect: (continent: string | null) => void;
}

export const Continent: React.FC<ContinentProps> = ({ selectedContinent, onContinentSelect }) => {
  const continents = [
    'Africa',
    'Asia',
    'Europe',
    'North America',
    'South America',
    'Oceania',
  ];

  return (
    <div className={styles.continentSection}>
      <h4 className={styles.sectionTitle}>Continents</h4>
      <ul className={styles.continentList}>
        {continents.map((continent) => (
          <li
            key={continent}
            className={
              selectedContinent === continent
                ? styles.activeContinent
                : styles.continentItem
            }
            onClick={() =>
              onContinentSelect(selectedContinent === continent ? null : continent)
            }
          >
            {continent}
          </li>
        ))}
      </ul>
    </div>
  );
};
*/
