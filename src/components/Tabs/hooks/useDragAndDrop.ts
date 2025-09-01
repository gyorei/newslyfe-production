/**
 * useDragAndDrop - Drag and Drop logika kezelése
 *
 * FUNKCIÓK:
 * - @dnd-kit sensor konfiguráció
 * - Drag end esemény kezelés
 * - Tab átrendezés logika
 * - Optimalizált beállítások
 */

import { useCallback, useMemo } from 'react';
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Tab } from '../../../types';

interface UseDragAndDropProps {
  tabs: Tab[];
  onReorderTabs: (newTabs: Tab[]) => void;
  debug?: boolean;
}

/**
 * Custom hook a drag-and-drop logika kezelésére
 * Elkülöníti a DnD funkcionalitást és konfiguráció központosítás
 */
export const useDragAndDrop = ({ tabs, onReorderTabs, debug = false }: UseDragAndDropProps) => {
  // Érzékelők konfigurálása
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 15,
      tolerance: 8,
      delay: 200,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Tab ID-k formázása dnd-kit számára
  const tabIds = useMemo(() => tabs.map((tab) => ({ id: tab.id })), [tabs]);

  // Drag start kezelés
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (debug) {
        console.log('Drag started:', event);
      }
    },
    [debug],
  );

  // Drag end kezelés - optimalizált
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return; // Nincs változás
      }

      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over.id);

      if (oldIndex === newIndex) {
        return; // Nincs tényleges mozgás
      }

      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      onReorderTabs(newTabs);

      if (debug) {
        console.log(`Tab moved from position ${oldIndex} to ${newIndex}`);
      }
    },
    [tabs, onReorderTabs, debug],
  );

  return {
    sensors,
    tabIds,
    handleDragStart,
    handleDragEnd,
  };
};
