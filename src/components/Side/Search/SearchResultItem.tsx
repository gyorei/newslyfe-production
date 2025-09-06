import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Search.module.css';
import {
  getFaviconUrl,
  getAlternativeFaviconUrls,
  extractDomain,
} from '../../../utils/favicon/favicon';
// Új import a központi dátumformázási modulból
import { formatRelativeTime } from '../../../utils/dateFormatter/dateFormatter';

interface SearchResult {
  id: number;
  title: string;
  url: string;
  created_at: string;
  language: string;
  source?: string; // Forrás neve
  sourceIcon?: string; // Forrás ikonja
  country?: string; // Ország
}

interface SearchResultItemProps {
  result: SearchResult;
}

const SearchResultItem: FC<SearchResultItemProps> = ({ result }) => {
  const { t } = useTranslation();
  // A getTimeAgo függvény eltávolítva - helyette a központi formatRelativeTime függvényt használjuk

  // Forrás domain kinyerése URL-ből
  const getDomainFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  };

  // Forrás neve a megjelenítéshez - ha nincs direkt forrás, akkor a domainből
  const getSourceName = (): string => {
    if (result.source) return result.source;

    // Ha nincs forrás név, próbáljuk meg az URL-ből kinyerni
    if (result.url) {
      const domain = getDomainFromUrl(result.url);
      if (domain) return domain.replace(/^www\./, '');
    }

    return t('search.unknownSource');
  };

  // Forrás információ összeállítása
  const getSourceInfo = (): string => {
    const parts = [];

    // Forrás nevét mindenképp megjelenítjük (domain végződés nélkül, ha lehetséges)
    const sourceName = getSourceName();
    // Eltávolítjuk a .hu, .com, stb. végződést, ha van
    const cleanSourceName = sourceName.replace(/\.(hu|com|org|net|io|co\.uk|de|pl|ro)$/, '');
    parts.push(cleanSourceName);

    // Eltelt idő - központi formatRelativeTime függvénnyel
    parts.push(formatRelativeTime(result.created_at));

    return parts.join(' · ');
  };

  // Favicon URL direktebb meghatározása
  const getDeterministicFaviconUrl = (): string | null => {
    // Először próbáljuk a központi favicon kezelő függvényt
    const faviconUrl = getFaviconUrl({
      url: result.url,
      sourceId: undefined,
      sourceName: result.source,
    });

    if (faviconUrl) return faviconUrl;

    // Ha nem sikerült, próbáljuk az URL-ből közvetlenül
    if (result.url) {
      const domain = getDomainFromUrl(result.url);
      if (domain) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      }
    }

    return null;
  };

  const faviconUrl = getDeterministicFaviconUrl();

  return (
    <div className={styles.resultItem}>
      <h4>
        <a href={result.url} target="_blank" rel="noopener noreferrer">
          {result.title}
        </a>
      </h4>
      <div className={styles.resultMeta}>
        {faviconUrl && (
          <img
            src={faviconUrl}
            alt=""
            className={styles.sourceIcon}
            onError={(e) => {
              const domain = extractDomain({ url: result.url, sourceName: result.source });
              const alternatives = getAlternativeFaviconUrls(domain);

              if (alternatives.length > 0) {
                // Azonnal próbáljuk a DuckDuckGo változatot
                (e.target as HTMLImageElement).src =
                  `https://external-content.duckduckgo.com/ip3/${domain}.ico`;

                // Ha az is sikertelen, próbáljuk a favicon.ico-t
                (e.target as HTMLImageElement).onerror = () => {
                  if (domain) {
                    (e.target as HTMLImageElement).src = `https://${domain}/favicon.ico`;
                    // Ha ez is sikertelen, elrejtjük
                    (e.target as HTMLImageElement).onerror = () => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    };
                  } else {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }
                };
              } else {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }}
          />
        )}
        <span className={styles.resultSource}>{getSourceInfo()}</span>

        {/* 3 pontos menü gomb */}
        <div className={styles.moreButtonContainer}>
          <button
            className={styles.moreButton}
            title="More options"
            onClick={(e) => {
              e.stopPropagation(); // Megakadályozza, hogy a találatra kattintás eseménye is lefusson
              e.preventDefault();
            }}
          >
            ⋮ {/* Három pont függőlegesen - menü ikon */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultItem;
