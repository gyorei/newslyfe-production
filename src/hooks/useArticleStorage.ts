/*
 * useArticleStorage.ts
 *
 * HOOK A HÍRCSIKKEK OLVASOTTSÁGÁNAK ÉS MENTÉSÉNEK KEZELÉSÉHEZ
 * ----------------------------------------------------------
 * Ez a hook biztosítja a cikkek olvasott/saved státuszának, mentésének, szinkronizációjának kezelését a News app-ban.
 *
 * Fő funkciók:
 *  - Cikk olvasottként jelölése, olvasottsági státusz lekérdezése
 *  - Cikk mentése (saved), mentett állapot ellenőrzése
 *  - Cikkek státuszainak tömeges lekérdezése (pl. lista megjelenítéshez)
 *  - Szinkronizáció indítása (syncNow)
 *
 * Kapcsolódó hook: useStorage (minden perzisztens műveletet ezen keresztül végez)
 *
 * Fontos minden olyan komponensben, ahol a cikkek olvasottságát, mentését, vagy státuszát kell kezelni (pl. Card, Panel, ArticleView, stb.).
 */
import { useState, useCallback } from 'react';
import { useStorage } from './useStorage';
import { ArticleData } from '../utils/datamanager/storage/indexedDBTypes';

export function useArticleStorage() {
  const { markArticleAsRead, getReadStatus, saveArticle, state, syncNow } = useStorage();
  const [readStatuses, setReadStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // Cikkek olvasottságának lekérdezése
  const fetchReadStatuses = useCallback(
    async (articleIds: string[]) => {
      setLoadingStatuses(true);
      try {
        const statuses = await getReadStatus(articleIds);
        setReadStatuses((prev) => ({ ...prev, ...statuses }));
      } catch (error) {
        console.error('Olvasottsági állapot lekérdezés hiba:', error);
      } finally {
        setLoadingStatuses(false);
      }
    },
    [getReadStatus],
  );

  // Cikk olvasottként jelölése
  const markAsRead = useCallback(
    async (articleId: string) => {
      try {
        await markArticleAsRead(articleId);
        setReadStatuses((prev) => ({ ...prev, [articleId]: true }));
        return true;
      } catch (error) {
        console.error('Olvasottként jelölés hiba:', error);
        return false;
      }
    },
    [markArticleAsRead],
  );

  // Cikk mentése
  const saveArticleToLibrary = useCallback(
    async (article: ArticleData) => {
      try {
        return await saveArticle(article);
      } catch (error) {
        console.error('Cikk mentés hiba:', error);
        return false;
      }
    },
    [saveArticle],
  );

  // Cikk mentett állapotának ellenőrzése
  const isArticleSaved = useCallback(
    (articleId: string) => {
      if (!state?.savedArticles) return false;
      return state.savedArticles.some((id: string) => id === articleId);
    },
    [state?.savedArticles],
  );

  return {
    isRead: useCallback((articleId: string) => readStatuses[articleId] || false, [readStatuses]),
    markAsRead,
    saveArticle: saveArticleToLibrary,
    isSaved: isArticleSaved,
    fetchReadStatuses,
    readStatuses,
    isLoadingStatuses: loadingStatuses,
    syncArticles: syncNow,
  };
}
