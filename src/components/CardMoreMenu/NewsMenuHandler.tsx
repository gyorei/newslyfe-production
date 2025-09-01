// src\components\CardMoreMenu\NewsMenuHandler.tsx
import React, { useState, useCallback } from 'react';
import { NewsItem } from '../../types';
import CardMoreMenu from './CardMoreMenu';
import { saveNews, isNewsSaved, removeSavedNews } from '../Utility/SavedNews/savedNewsUtils';

// A Content.tsx-ből átemelt kód a CardMoreMenu kezeléséhez
export const useNewsMenuHandler = (filteredNewsItems: NewsItem[]) => {
  // Menü állapotok
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [currentMenuItem, setCurrentMenuItem] = useState<NewsItem | null>(null);
  const [menuCardEl, setMenuCardEl] = useState<HTMLElement | null>(null);

  // Mentett hírek állapota
  const [savedNewsIds, setSavedNewsIds] = useState<Record<string, boolean>>({});

  // Mentett hírek állapotának frissítése
  React.useEffect(() => {
    const savedIds: Record<string, boolean> = {};
    filteredNewsItems.forEach((item) => {
      if (item.id && isNewsSaved(item.id)) {
        savedIds[item.id] = true;
      }
    });
    setSavedNewsIds(savedIds);
  }, [filteredNewsItems]);

  // ✅ ÚJ: Hozzunk létre egy ref-et, ami mindig a legfrissebb tömböt tárolja
  const filteredNewsItemsRef = React.useRef(filteredNewsItems);
  React.useEffect(() => {
    filteredNewsItemsRef.current = filteredNewsItems;
  }, [filteredNewsItems]);

  // Menü megnyitás/bezárás kezelése
  const handleToggleMenu = useCallback(
    (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => {
      console.log('🔍 handleToggleMenu called:', { cardId, anchorEl: !!anchorEl });
      setOpenMenuCardId((prevOpenMenuCardId) => {
        console.log('🔍 Current openMenuCardId:', prevOpenMenuCardId);
        
        if (cardId && cardId === prevOpenMenuCardId) {
        console.log('🔍 Closing menu for same card');
          setMenuAnchorEl(null);
          setCurrentMenuItem(null);
          setMenuCardEl(null);
          return null;
        } else if (cardId && anchorEl) {
       console.log('🔍 Opening menu for card:', cardId);
          setMenuAnchorEl(anchorEl);
          setMenuCardEl(cardEl || null);
          // ✅ Ahelyett, hogy közvetlenül a filteredNewsItems-t használnánk,
          // most a ref-et használjuk, így a callback referenciája stabil marad.
          const selectedItem = filteredNewsItemsRef.current.find((item) => item.id === cardId);
          setCurrentMenuItem(selectedItem || null);
          return cardId;
        } else {
          console.log('🔍 Closing menu (no card or anchor)');
          setMenuAnchorEl(null);
          setCurrentMenuItem(null);
          setMenuCardEl(null);
          return null;
        }
      });
    }, []); // ✅ Függőségi lista üres, a callback referenciája stabil

  const handleCloseMenu = useCallback(() => {
    // console.log('🔍 handleCloseMenu called - closing menu');
    setOpenMenuCardId(null);
    setMenuAnchorEl(null);
    setCurrentMenuItem(null);
    setMenuCardEl(null);
  }, []);

  // Menü műveletek
  const handleSave = useCallback(() => {
    if (!currentMenuItem?.id) {
      console.log('[NewsMenuHandler] Mentés: nincs id, nem menthető!', currentMenuItem);
      return;
    }
    const newsId = currentMenuItem.id;
    console.log('[NewsMenuHandler] Mentés gomb megnyomva:', newsId, currentMenuItem);
    if (savedNewsIds[newsId]) {
      console.log('[NewsMenuHandler] Törlés a mentettekből:', newsId);
      if (removeSavedNews(newsId)) {
        setSavedNewsIds((prev) => {
          const updated = { ...prev };
          delete updated[newsId];
          return updated;
        });
        console.log('[NewsMenuHandler] Törlés sikeres:', newsId);
      } else {
        console.log('[NewsMenuHandler] Törlés sikertelen:', newsId);
      }
    } else {
      console.log('[NewsMenuHandler] Mentés a localStorage-ba:', newsId);
      const savedItem = saveNews(currentMenuItem);
      if (savedItem) {
        setSavedNewsIds((prev) => ({
          ...prev,
          [newsId]: true,
        }));
        console.log('[NewsMenuHandler] Mentés sikeres:', savedItem);
      } else {
        console.log('[NewsMenuHandler] Mentés sikertelen:', newsId);
      }
    }
    handleCloseMenu();
  }, [currentMenuItem, savedNewsIds, handleCloseMenu]);

  const handleShare = useCallback(() => {
    if (currentMenuItem?.url && navigator.share) {
      navigator
        .share({
          title: currentMenuItem.title,
          text: currentMenuItem.description || '',
          url: currentMenuItem.url,
        })
        .catch((err) => console.error('Megosztás sikertelen:', err));
    }
    handleCloseMenu();
  }, [currentMenuItem, handleCloseMenu]);

  const handleAnalyze = useCallback(() => {
    console.log('Analizálás:', currentMenuItem?.id);
    handleCloseMenu();
  }, [currentMenuItem, handleCloseMenu]);

  const handleHideSource = useCallback(() => {
    console.log('Forrás elrejtése:', currentMenuItem?.sourceId);
    handleCloseMenu();
  }, [currentMenuItem, handleCloseMenu]);

  // Segédfüggvények
  const getSaveText = useCallback(
    (id?: string) => {
      if (id && savedNewsIds[id]) {
        return '🗑️ Remove from saved';
      }
      return '⭐ Save';
    },
    [savedNewsIds],
  );

  // A CardMoreMenu renderelésének metódusa
  const renderMenu = () => (
    <CardMoreMenu
      open={!!openMenuCardId && !!menuAnchorEl}
      anchorEl={menuAnchorEl}
      onClose={handleCloseMenu}
      onSave={handleSave}
      onShare={handleShare}
      onAnalyze={handleAnalyze}
      onHideSource={handleHideSource}
      url={currentMenuItem?.url}
      saveText={getSaveText(currentMenuItem?.id)}
      cardEl={menuCardEl}
    />
  );

  return {
    openMenuCardId,
    handleToggleMenu,
    handleCloseMenu,
    renderMenu,
  };
};

export default useNewsMenuHandler;
