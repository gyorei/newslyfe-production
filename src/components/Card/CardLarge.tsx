/*
import * as React from 'react';
import { Card, CardProps } from './Card';
import styles from './Card.module.css';

interface CardLargeProps extends CardProps {
  fullContent?: string;
  tags?: string[];
}

export const CardLarge: React.FC<CardLargeProps> = (props) => {
  const { fullContent, tags, ...cardProps } = props;
  
  return (
    <div className={styles.cardLargeWrapper}>
      <Card {...cardProps} className={styles.cardLarge}>
        <div className={styles.cardLargeActions}>
          <button className={styles.actionButton} title="Save">
            <span className={styles.buttonIcon}>📌</span>
          </button>
          <button className={styles.actionButton} title="Share">
            <span className={styles.buttonIcon}>🔗</span>
          </button>
          <button className={styles.actionButton} title="Full article">
            <span className={styles.buttonIcon}>📄</span>
          </button>
        </div>
      </Card>
      
      {fullContent && (
        <div className={styles.cardFullContent}>
          <p>{fullContent}</p>
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div className={styles.cardTags}>
          {tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
*/
