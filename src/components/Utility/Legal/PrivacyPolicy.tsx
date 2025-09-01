import React from 'react';
import styles from './Legal.module.css';

// ========================================
// 🎥 PRIVACY POLICY KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Adatvédelmi tájékoztató Google AdSense szabályoknak megfelelően

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className={styles.privacyPolicy}>
      <h2>Adatvédelmi Tájékoztató</h2>
      
      <section>
        <h3>1. Bevezetés</h3>
        <p>
          Ez az adatvédelmi tájékoztató leírja, hogyan gyűjtjük, használjuk és védjük az Ön személyes adatait 
          az Európai Hírgyűjtő alkalmazás használata során.
        </p>
      </section>

      <section>
        <h3>2. Adatgyűjtés</h3>
        <p>Az alábbi adatokat gyűjtjük:</p>
        <ul>
          <li><strong>Használati adatok:</strong> Mely híreket olvassa, milyen forrásokat választ</li>
          <li><strong>Technikai adatok:</strong> Böngésző típusa, IP cím, eszköz információ</li>
          <li><strong>Preferenciák:</strong> Nyelvi beállítások, témaválasztások</li>
        </ul>
      </section>

      <section>
        <h3>3. Google AdSense</h3>
        <p>
          <strong>Reklámok:</strong> Az alkalmazás Google AdSense reklámokat használ. A Google és partnerei 
          cookie-kat és hasonló technológiákat használhatnak a személyre szabott reklámok megjelenítéséhez.
        </p>
        <p>
          <strong>Adatmegosztás:</strong> A Google AdSense használata miatt bizonyos adatok megoszthatók 
          a Google-lal a reklámok személyre szabásához.
        </p>
      </section>

      <section>
        <h3>4. Cookie-k és Hasonló Technológiák</h3>
        <p>
          Az alkalmazás cookie-kat és hasonló technológiákat használ a felhasználói élmény javítása érdekében:
        </p>
        <ul>
          <li><strong>Szükséges cookie-k:</strong> Az alkalmazás működéséhez szükséges</li>
          <li><strong>Analitikai cookie-k:</strong> Használati statisztikák készítéséhez</li>
          <li><strong>Reklám cookie-k:</strong> Google AdSense által használt</li>
        </ul>
      </section>

      <section>
        <h3>5. Adatok Megőrzése</h3>
        <p>
          Az Ön adatait csak annyi ideig őrizzük meg, amíg az szükséges az alkalmazás működéséhez 
          vagy amíg Ön nem kéri törlésüket.
        </p>
      </section>

      <section>
        <h3>6. Jogai</h3>
        <p>Önnek joga van:</p>
        <ul>
          <li>Hozzáférni az Ön adataihoz</li>
          <li>Kérni az adatok helyesbítését</li>
          <li>Kérni az adatok törlését</li>
          <li>Korlátozni az adatfeldolgozást</li>
          <li>Adathordozhatóságra</li>
        </ul>
      </section>

      <section>
        <h3>7. Kapcsolat</h3>
        <p>
          Ha kérdése van az adatvédelmi tájékoztatóval kapcsolatban, keressen minket:
        </p>
        <p>
          <strong>Email:</strong> privacy@europeannewsaggregator.com<br />
          <strong>Utolsó frissítés:</strong> {new Date().toLocaleDateString('hu-HU')}
        </p>
      </section>
    </div>
  );
};
