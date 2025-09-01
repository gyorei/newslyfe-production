A forráskód folyama:
Amikor a felhasználó belép az alkalmazásba:

Először meghatározzuk a felhasználó földrajzi helyét
Csak az adott ország/kontinens forrásait töltjük be
Nem indítunk ellenőrzést más régiók forrásaira
A monitor betöltésekor:

A lokalitás beállításokat adjuk át a monitornak
A monitor csak a kiválasztott régió forrásait jeleníti meg és ellenőrzi
Az adatfrissítési ciklus:

Az RSS adatok cache-elése történjen hosszabb ideig (már beállítva 60 percre)
Explicit módon jelezzük a rendszernek, ha más régiókat is be akarunk tölteni
Hogyan oldjuk meg a folyamatos keresés problémáját?
A batch-progress üzenetek azt jelzik, hogy a rendszer több ezer forrást dolgoz fel kötegekben. Ez a viselkedés valószínűleg a RssMonitorService-ben van implementálva. A módosítás során:

A betöltési folyamatot meg kell szakítani, amint a helyi források ellenőrzése megtörtént
Csak explicit felhasználói kérésre induljon el más régiók betöltése
Használjuk a már beállított LOCATION_BASED_FILTERING konfigurációs értékeket
Következő lépés:
Kérem, mutasd meg a RssMonitorService.ts fájl tartalmát, hogy pontosabb javaslatot tehessek a módosításokra.

Összefoglalás
A rendszert úgy kell módosítani, hogy:

Az alkalmazás indulásakor automatikusan meghatározza a felhasználó országát
Alapértelmezetten csak az adott ország forrásait töltse be
A felhasználó explicit választhasson országot vagy kontinenst, ha más hírekre is kíváncsi
A betöltés után ne keressen tovább más források közt (a monitor helyesen már most is a cache-ből szolgál ki, ha az még érvényes)
A fenti módosításokkal biztosítható, hogy a rendszer csak a releváns forrásokat töltse be, és ne pazarolja az erőforrásokat külföldi források ellenőrzésére, kivéve ha a felhasználó kifejezetten kéri.

# RSS Forrás Betöltési Megoldás

A helyzetet most már teljesen átlátom. Nagy szerencse, hogy már létezik egy komplett lokalizációs szolgáltatás (`localLocationService`) a rendszerben, ami pontosan meg tudja határozni a felhasználó földrajzi helyzetét. A probléma nem a helymeghatározással van, hanem azzal, hogy a monitor/RSS betöltő szolgáltatás nem használja ezt az információt a források szűrésére.

## A pontos módosítási terv

### 1. RssMonitorPanel.tsx módosítása

Ez a fő hiba forrása. A panelnek használnia kell a már létező `localLocationService`-t a Sources betöltése előtt.

```typescript
// Módosítandó fájl: c:\newsx\src\data\Monitor\RssMonitorPanel.tsx

// Import hozzáadása
import { localLocationService } from '../local/Location';

// loadSourceStatuses függvény módosítása
const loadSourceStatuses = async () => {
  if (loading) return;

  setLoading(true);
  setProgress({ current: 0, total: 1, message: 'Földrajzi hely meghatározása...' });

  try {
    // 1. Felhasználó földrajzi helyének meghatározása
    const location = await localLocationService.getLocation();
    console.log(
      `[RssMonitorPanel] Felhasználó helye: ${location.country} (${location.countryCode})`,
    );

    setProgress({ current: 0, total: 1, message: 'Források betöltése az adott országból...' });

    // 2. CSAK a felhasználó országából származó források betöltése
    const sources = await apiClient.getSourcesByCountry(location.countryCode);
    console.log(`[RssMonitorPanel] ${sources.length} forrás betöltve: ${location.country}`);

    // 3. Csak ezeknek a forrásoknak az ellenőrzése
    setProgress({
      current: 0,
      total: sources.length,
      message: `Források ellenőrzése (0/${sources.length})`,
    });

    const statuses = await RssMonitorService.checkAllSources(sources);
    setSourceStatuses(statuses);

    // Statisztikák frissítése
    updateStatistics(statuses);

    setLastRefresh(new Date());
  } catch (error) {
    console.error('Hiba a források ellenőrzése során:', error);
  } finally {
    setLoading(false);
    setProgress(null);
  }
};
```

### 2. apiClient.ts kiegészítése

Ha még nem létezik ilyen funkció, hozzá kell adni az API klienshez:

```typescript
// Módosítandó fájl: c:\newsx\src\api\apiClient.ts

// Új metódus hozzáadása
async getSourcesByCountry(countryCode: string): Promise<DbSourceRow[]> {
  try {
    // Lekérjük az összes forrást
    const sources = await this.getSources();

    // Szűrés országkód alapján
    return sources.filter(source => {
      // Ellenőrizzük az URL domaint és az ország kódot
      const url = source.url.toLowerCase();
      const sourceName = source.name.toLowerCase();

      // 1. Ha van explicit country mező, azt használjuk
      if (source.country && source.country.toLowerCase() === countryCode.toLowerCase()) {
        return true;
      }

      // 2. Domain ellenőrzés
      const domainEnding = `.${countryCode.toLowerCase()}`;
      if (url.endsWith(domainEnding)) {
        return true;
      }

      // 3. Név alapú ellenőrzés, ha ország neve szerepel benne
      const countryName = localLocationService.getCountryNameByCode(countryCode);
      if (countryName && sourceName.includes(countryName.toLowerCase())) {
        return true;
      }

      // Egyéb feltételek...

      return false;
    });
  } catch (error) {
    console.error('Hiba a források országonkénti lekérésekor:', error);
    return [];
  }
}
```

### 3. Ország/kontinens választó felület hozzáadása a monitorhoz

```tsx
// Új komponens a RssMonitorPanel.tsx fájlban

const CountrySelector = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<{ code: string; name: string }[]>(
    [],
  );

  // Országok betöltése
  useEffect(() => {
    const loadCountries = async () => {
      try {
        // Felhasználó földrajzi helyének meghatározása
        const location = await localLocationService.getLocation();
        setSelectedCountry(location.country);
        setCountryCode(location.countryCode);

        // Elérhető országok listájának lekérése
        const countries = await apiClient.getAvailableCountries();
        setAvailableCountries(countries);
      } catch (error) {
        console.error('Országok betöltési hiba:', error);
      }
    };

    loadCountries();
  }, []);

  // Ország váltása
  const handleCountryChange = async (code: string, name: string) => {
    setSelectedCountry(name);
    setCountryCode(code);

    // Források újratöltése az új országból
    const sources = await apiClient.getSourcesByCountry(code);
    const statuses = await RssMonitorService.checkAllSources(sources);
    setSourceStatuses(statuses);
    updateStatistics(statuses);
    setLastRefresh(new Date());
  };

  return (
    <div className="country-selector">
      <h3>Ország kiválasztása</h3>

      <select
        value={countryCode || ''}
        onChange={(e) => {
          const code = e.target.value;
          const country = availableCountries.find((c) => c.code === code);
          if (country) {
            handleCountryChange(code, country.name);
          }
        }}
      >
        {availableCountries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Összefoglalás

A fő változtatás, hogy a `RssMonitorPanel` használja a már létező `localLocationService`-t a felhasználó helyének meghatározására, és csak az adott országból töltse be a forrásokat. A felület kiegészül egy országválasztó résszel is, ahol a felhasználó explicit módon választhat országot.

Ez a módosítás:

1. Jelentősen csökkenti a hálózati forgalmat
2. Relevánsabb híreket jelenít meg
3. Megszünteti a külföldi oldalakkal kapcsolatos hibákat a hibanaplóból
4. Gyorsítja az alkalmazást, mert kevesebb forrást kell ellenőrizni

A forrásszűrést így nem a monitor szolgáltatás végzi, hanem már a betöltéskor megtörténik, és csak a releváns források kerülnek ellenőrzésre.
