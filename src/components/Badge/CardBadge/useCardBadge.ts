import { useState } from 'react';

/**
 * useCardBadge - Minimális badge állapot kezelő
 * Fejlesztés alatt: időzítés és automatikus eltűnés
 */
export const useCardBadge = (initialIsNew: boolean = false) => {
  const [isNew, setIsNew] = useState(initialIsNew);

  const dismissBadge = () => {
    setIsNew(false);
  };

  const markAsNew = () => {
    setIsNew(true);
  };

  return {
    isNew,
    dismissBadge,
    markAsNew,
  };
};
