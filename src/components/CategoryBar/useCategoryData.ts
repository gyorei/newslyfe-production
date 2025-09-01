import { useEffect } from 'react';
import { useCategoryContext } from './CategoryContext';
// Importáljuk a szükséges elemeket a categoryMapping-ből
import { categoryKeywords, defaultCategories } from './categoryMapping';

// Minimális típusdefiníció a newsItems részére
interface NewsItem {
  title?: string;
  description?: string;
  categories?: string[]; // Explicit kategóriák a hírobjektumban
}

/**
 * Egy hír kategorizálása a tartalma alapján kulcsszavak segítségével.
 * @param item A kategorizálandó hír
 * @returns A detektált kategóriák tömbje
 */
function categorizeNewsItem(item: NewsItem): string[] {
  // 1. Ha a hírnek már van explicit kategóriája, azt használjuk
  if (item.categories && Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories;
  }

  // 2. Kulcsszó alapú kategorizálás
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  const detectedCategories: string[] = [];

  // Végigmegyünk a definiált kategóriákon és kulcsszavakon
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    // Ellenőrizzük, hogy a kulcsszavak közül valamelyik szerepel-e a szövegben
    const hasKeyword = keywords.some((keyword) => {
      // Többszavas kulcsszavak esetén egyszerű 'includes' ellenőrzés
      if (keyword.includes(' ')) {
        return text.includes(keyword);
      }
      // Egyszavas kulcsszavaknál szóhatárokat ellenőrzünk (RegExp)
      const regex = new RegExp(`\\b${keyword}\\b`, 'i'); // 'i' a kis/nagybetű érzéketlenségért
      return regex.test(text);
    });

    if (hasKeyword) {
      detectedCategories.push(category);
    }
  });

  // 3. Ha nem találtunk egyetlen kategóriát sem, az 'Other' kategóriát adjuk vissza
  if (detectedCategories.length === 0) {
    return ['Other'];
  }

  return detectedCategories;
}

/**
 * Hook a kategória adatok kinyeréséhez és a kontextus frissítéséhez.
 * @param newsItems A feldolgozandó hírek listája
 * @param activeTabId Az aktuálisan aktív fül azonosítója (jelenleg nincs használva a logikában, de a függőségek miatt marad)
 */
export function useCategoryData(newsItems: NewsItem[], activeTabId: string) {
  // Kivesszük a setCategories-t is a kontextusból
  const { setCategoryCounts, setCategories } = useCategoryContext();

  useEffect(() => {
    // Csak akkor futunk le, ha vannak hírek
    if (newsItems && newsItems.length > 0) {
      const counts: Record<string, number> = {};
      const uniqueCategories = new Set<string>();

      // Hírek feldolgozása
      newsItems.forEach((item) => {
        // A kulcsszó-alapú kategorizáló függvény használata
        const itemCategories = categorizeNewsItem(item);

        // Kategóriák számolása és egyedi kategóriák gyűjtése
        itemCategories.forEach((category) => {
          counts[category] = (counts[category] || 0) + 1;
          uniqueCategories.add(category);
        });
      });

      // Kategória számok frissítése a kontextusban
      setCategoryCounts(counts);

      // Az elérhető kategóriák listájának összeállítása:
      // Először az alapértelmezett kategóriák, majd a többi talált kategória
      // (kivéve az alapértelmezetteket, hogy ne legyenek duplikátumok)
      const allCategories = [
        ...defaultCategories,
        ...Array.from(uniqueCategories).filter(
          (cat) => !defaultCategories.includes(cat) && cat !== 'Other',
        ), // Az 'Other'-t általában nem akarjuk chipként mutatni, hacsak nincs más
      ];
      // Ha csak az 'Other' kategória van, akkor azt is hozzáadjuk
      if (
        uniqueCategories.size === 1 &&
        uniqueCategories.has('Other') &&
        !defaultCategories.includes('Other')
      ) {
        allCategories.push('Other');
      }

      // Kategória lista frissítése a kontextusban
      setCategories(allCategories);
    } else {
      // Ha nincsenek hírek, alaphelyzetbe állítjuk a kontextust
      setCategories(defaultCategories);
      setCategoryCounts({});
    }
    // Hozzáadjuk a setCategories-t a függőségi listához
  }, [newsItems, activeTabId, setCategoryCounts, setCategories]);
}

// Az alapértelmezett export eltávolítása, ha nincs rá szükség
// export default useCategoryData; // Ezt csak akkor használd, ha ez az egyetlen export a fájlban
