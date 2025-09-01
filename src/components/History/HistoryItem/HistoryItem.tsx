import React from 'react';
import styles from './HistoryItem.module.css';

interface HistoryItemProps {
  time: string; // time - időpont
  title: string; // title - cím
  url: string; // url - hivatkozási cím
}

// Egyetlen előzmény elem megjelenítése
export const HistoryItem: React.FC<HistoryItemProps> = ({ time, title, url }) => {
  return (
    <li className={styles.item}>
      <span className={styles.time}>{time}</span>
      <a className={styles.title} href={url} target="_blank" rel="noopener noreferrer">{title}</a>
      <span className={styles.url}>{url}</span>
    </li>
  );
};

export default HistoryItem;
