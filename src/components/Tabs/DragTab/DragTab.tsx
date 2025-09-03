// src\components\Tabs\DragTab\DragTab.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '../Tabs.module.css';
import dragStyles from './DragTab.module.css';

interface DragTabProps {
  id: string;
  title: string;
  active?: boolean;
  mode?: 'news' | 'search' | 'video' | 'new' | 'home' | 'my_page'; // ✅ 'my_page' hozzáadva
  onClose: () => void;
  onClick: () => void;
  onShowNewNews?: (tabId: string) => void;
}

/**
 * DragTab - Akadálymentes változat
 *
 * A Tab komponens drag-and-drop funkcióval és bővített akadálymentességi támogatással
 */
export const DragTab = React.memo(
  ({
    id,
    title,
    active = false,
    mode = 'news',
    onClose,
    onClick,
    onShowNewNews,
    ...restProps
  }: DragTabProps & React.HTMLAttributes<HTMLDivElement>) => {
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
    });

    // Javítás: Explicit módon kivesszük az ütköző attribútumokat
    const {
      role: _role,
      tabIndex: _tabIndex,
      'aria-describedby': _ariaDescribedBy,
      ...otherAttributes
    } = attributes;

    // Drag állapot stílusok
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 100 : undefined,
      opacity: isDragging ? 0.9 : undefined,
      boxShadow: isDragging ? '0 0 20px rgba(0, 0, 0, 0.15)' : undefined,
      border: isDragging ? '1px dashed var(--color-border)' : undefined,
      pointerEvents: isDragging ? ('none' as const) : undefined,
    };

    // Bezárás kezelése
    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setTimeout(() => {
        onClose();
      }, 50);
    };

    // Kattintás kezelése
    const handleClick = () => {
      if (isDragging) {
        return;
      }
      console.log('[DragTab] Tab kattintás:', { id, title, mode });
      onClick();
    };

    // Billentyűzet kezelés
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onClose();
      }
    };

    const dragInstructionsId = `tab-drag-instructions-${id}`;

    // Tab ikon meghatározása
    const getTabIcon = (mode: string) => {
      switch (mode) {
        case 'video':
          return '🎥';
        case 'search':
          return '🔍';
        case 'new':
          return '🏠';
        default:
          return '📰';
      }
    };

    // Pointer down kezelés
    const handlePointerDown = (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;

      // Badge kattintás kizárása a drag-ből
      if (
        target.closest('[role="button"][aria-label*="új hír"]') ||
        target.closest('[title*="új hír"]') ||
        target.className.includes('notificationBadge') ||
        (target.parentElement && target.parentElement.className.includes('notificationBadge'))
      ) {
        e.stopPropagation();
        return;
      }

      listeners?.onPointerDown?.(e);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${styles.tab} ${mode === 'video' ? styles.video : ''} ${active ? styles.active : ''} ${isDragging ? dragStyles.dragging : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={title}
        role="tab"
        aria-selected={active}
        aria-label={t('dragTab.tabLabel', { title })}
        tabIndex={active ? 0 : -1}
        aria-controls={`tab-panel-${id}`}
        aria-grabbed={isDragging}
        aria-describedby={dragInstructionsId}
        {...restProps}
        {...otherAttributes}
        {...listeners}
        onPointerDown={handlePointerDown}
      >
        <span>{title}</span>

        <button
          className={dragStyles.closeTab}
          onClick={handleCloseClick}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={t('dragTab.closeTabLabel', { title })}
          tabIndex={0}
          title={t('dragTab.closeTabTitle')}
        >
          ×
        </button>

        {/* Képernyőolvasók számára útmutatás */}
        <span id={dragInstructionsId} className={dragStyles.visuallyHidden}>
          {t('dragTab.dragInstructions')}
        </span>
      </div>
    );
  },
);
