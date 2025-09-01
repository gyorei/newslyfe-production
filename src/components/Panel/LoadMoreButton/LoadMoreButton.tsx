import React from 'react';
import styles from './LoadMoreButton.module.css';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  hasMoreSources: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  label?: string;
}

/**
 * További hírek betöltésére szolgáló gomb komponens
 *
 * @param onLoadMore - A további hírek betöltését kezelő függvény
 * @param hasMoreSources - Van-e még betölthető forrás
 * @param isLoading - Betöltés alatt áll-e (alapértelmezett: false)
 * @param isDisabled - Le van-e tiltva (alapértelmezett: false)
 * @param label - A gomb felirata (alapértelmezett: "További hírek betöltése")
 */
export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onLoadMore,
  hasMoreSources,
  isLoading = false,
  isDisabled = false,
  label = 'További hírek betöltése',
}) => {
  // Ha nincs több forrás vagy le van tiltva vagy betöltés alatt áll
  if (!hasMoreSources || isDisabled || isLoading) return null;

  return (
    <div className={styles.loadMoreContainer}>
      <button onClick={onLoadMore} className={styles.loadMoreButton} disabled={isLoading}>
        {label}
      </button>
    </div>
  );
};

/**
 * Hook a "LoadMore" funkcionalitáshoz - opcionális, ha komplexebb logika szükséges
 */
export const useLoadMore = (loadMoreSources: () => void) => {
  const handleLoadMore = React.useCallback(() => {
    console.log('[LoadMoreButton] További hírek betöltése...');
    loadMoreSources();
  }, [loadMoreSources]);

  return { handleLoadMore };
};

export default LoadMoreButton;
