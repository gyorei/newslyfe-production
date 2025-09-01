/**
 * TabBadge komponens
 *
 * A füleken megjelenő kattintható badge komponens
 * Megjeleníti az új hírek számát és aktiválja a side panel-t
 */

import React from 'react';
import styles from './Badge.module.css';

export interface TabBadgeProps {
  count: number;
  animated?: boolean;
  onClick?: () => void;
}

export const TabBadge: React.FC<TabBadgeProps> = ({ count, animated = true, onClick }) => {
  // Ha nincs új hír, ne jelenjen meg
  if (count <= 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.();
  };

  // ÚJ: Pointer események megállítása
  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <span
      className={`${styles.notificationBadge} ${animated ? styles.badgeAnimation : ''}`}
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      title={`${count} új hír - Kattints a részletekért`}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${count} új hír érkezett. ${onClick ? 'Kattints a megtekintéshez.' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
