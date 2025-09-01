import React, { useState, useEffect } from 'react';
import styles from './ArticleTab.module.css';

interface ArticleTabProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function ArticleTab({ url, title, onClose }: ArticleTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Nem sikerült betölteni a cikket');
  };

  return (
    <div className={styles.articleTab}>
      <div className={styles.header}>
        <h3 className={styles.title} title={title}>{title}</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className={styles.content}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Betöltés...</span>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => window.open(url, '_blank')}>
              Megnyitás új ablakban
            </button>
          </div>
        )}
        
        <iframe
          src={url}
          className={styles.iframe}
          onLoad={handleLoad}
          onError={handleError}
          title={title}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}