import * as React from 'react';
import styles from './Tabs.module.css';

interface AddTabProps {
  onAdd: () => void;
}

export const AddTab: React.FC<AddTabProps> = ({ onAdd }) => {
  return (
    <button className={styles.addTab} onClick={onAdd}>
      +
    </button>
  );
};
