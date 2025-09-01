import React from 'react';
import styles from './Legal.module.css';

// ========================================
// 🎥 TERMS OF SERVICE KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Szolgáltatási feltételek

export const TermsOfService: React.FC = () => {
  return (
    <div className={styles.termsOfService}>
      <h2>Szolgáltatási Feltételek</h2>
      
      <section>
        <h3>1. Általános Feltételek</h3>
        <p>
          Az Európai Hírgyűjtő alkalmazás használatával Ön elfogadja ezeket a szolgáltatási feltételeket. 
          Az alkalmazás ingyenesen használható, de bizonyos korlátozások vonatkoznak rá.
        </p>
      </section>

      <section>
        <h3>2. Szolgáltatás Leírása</h3>
        <p>Az alkalmazás a következő szolgáltatásokat nyújtja:</p>
        <ul>
          <li><strong>Hírek összegyűjtése:</strong> Európai hírek aggregálása különböző forrásokból</li>
          <li><strong>Kategorizálás:</strong> Hírek rendszerezése országok és témák szerint</li>
          <li><strong>Keresés:</strong> Speciális keresési funkciók</li>
          <li><strong>Videó tartalom:</strong> Videó hírek megjelenítése</li>
        </ul>
      </section>

      <section>
        <h3>3. Felhasználói Felelősség</h3>
        <p>Ön felelős:</p>
        <ul>
          <li>Az alkalmazás törvényes használatáért</li>
          <li>A fiók adatainak biztonságáért</li>
          <li>A tartalom megfelelő értékeléséért</li>
          <li>Nem terjeszti a hamis információkat</li>
        </ul>
      </section>

      <section>
        <h3>4. Reklámok és Harmadik Fél Szolgáltatások</h3>
        <p>
          <strong>Google AdSense:</strong> Az alkalmazás Google AdSense reklámokat tartalmaz. 
          A reklámok tartalma nem felőlünk származik, és nem felelünk meg érte.
        </p>
        <p>
          <strong>Harmadik fél linkek:</strong> Az alkalmazás külső weboldalakra mutató linkeket tartalmaz. 
          Ezek tartalmáért nem felelünk.
        </p>
      </section>

      <section>
        <h3>5. Szellemi Tulajdon</h3>
        <p>
          Az alkalmazás és annak tartalma (kivéve a külső forrásokból származó híreket) 
          a mi szellemi tulajdonunk. A tartalom másolása, terjesztése engedély nélkül tilos.
        </p>
      </section>

      <section>
        <h3>6. Szolgáltatás Módosítása</h3>
        <p>
          Fenntartjuk a jogot, hogy bármikor módosítsuk vagy megszüntessük a szolgáltatást. 
          A jelentős változásokról előzetesen értesítjük a felhasználókat.
        </p>
      </section>

      <section>
        <h3>7. Felelősség Korlátozása</h3>
        <p>
          Az alkalmazás "ahogy van" alapon biztosított. Nem vállalunk felelősséget:
        </p>
        <ul>
          <li>A hírek pontosságáért</li>
          <li>A szolgáltatás megszakadásáért</li>
          <li>Adatvesztésért</li>
          <li>Közvetett károkért</li>
        </ul>
      </section>

      <section>
        <h3>8. Jogviták</h3>
        <p>
          A jelen feltételekkel kapcsolatos viták magyar bíróság előtt rendezendők. 
          A magyar jog az irányadó.
        </p>
      </section>

      <section>
        <h3>9. Kapcsolat</h3>
        <p>
          Ha kérdése van a szolgáltatási feltételekkel kapcsolatban:
        </p>
        <p>
          <strong>Email:</strong> legal@europeannewsaggregator.com<br />
          <strong>Utolsó frissítés:</strong> {new Date().toLocaleDateString('hu-HU')}
        </p>
      </section>
    </div>
  );
};
