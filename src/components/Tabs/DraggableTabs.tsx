/**
 * src\components\Tabs\DraggableTabs.tsx
 * DraggableTabs - Tab kezelő komponens drag & drop funkcióval
 *
 * Funkciók:
 * - Tab renderelés különböző stratégiákkal (normál, optimalizált, virtualizált)
 * - Drag & drop funkcionalitás
 * - Teljesítmény optimalizációk
 * - Akadálymentes támogatás
 */

import * as React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { DragTab } from './DragTab/DragTab';
import { AddTab } from './AddTab';
import { ControlPanelButton } from '../ControlPanel/ControlPanelButton';
import styles from './Tabs.module.css';
import { Tab } from '../../types';

// Custom hooks importálása
import { useTabOperations } from './hooks/useTabOperations';
// import { useTabScroll } from '../ScrollContainer/useTabScroll';
import { useDragAndDrop } from './hooks/useDragAndDrop';

// Tab Renderer komponens
interface TabRendererProps {
  tab: Tab;
  keyPrefix: string;
  tabOperations: ReturnType<typeof useTabOperations>;
}

const TabRenderer = React.memo(({ tab, keyPrefix, tabOperations }: TabRendererProps) => (
  <DragTab
    key={`${keyPrefix}-${tab.id}`}
    id={tab.id}
    title={tab.title}
    active={tab.active}
    mode={tab.mode}
    onClose={() => tabOperations.handleCloseTab(tab.id)}
    onClick={() => tabOperations.handleActivateTab(tab.id)}
    onShowNewNews={tabOperations.handleShowNewNews}
  />
));

TabRenderer.displayName = 'TabRenderer';

// Debug konstansok
const DEBUG_PERFORMANCE = process.env.NODE_ENV === 'development';
const OPTIMIZATION_THRESHOLD = 2;

/**
 * Virtualizált tab lista nagy tab számokhoz
 */
const VirtualizedTabList = React.memo(
  ({
    tabs,
    tabOperations,
  }: {
    tabs: Tab[];
    tabOperations: ReturnType<typeof useTabOperations>;
  }) => {
    const maxVisibleTabs = 6;
    const activeIndex = tabs.findIndex((tab) => tab.active);

    const windowCalculation = React.useMemo(() => {
      const half = Math.floor(maxVisibleTabs / 2);
      const startIndex = Math.max(0, Math.min(activeIndex - half, tabs.length - maxVisibleTabs));
      const endIndex = Math.min(tabs.length, startIndex + maxVisibleTabs);
      return { startIndex, endIndex };
    }, [activeIndex, maxVisibleTabs, tabs.length]);

    const visibleTabs = React.useMemo(
      () => tabs.slice(windowCalculation.startIndex, windowCalculation.endIndex),
      [tabs, windowCalculation.startIndex, windowCalculation.endIndex],
    );

    return (
      <>
        {visibleTabs.map((tab) => (
          <TabRenderer
            key={`virtual-${tab.id}`}
            tab={tab}
            tabOperations={tabOperations}
            keyPrefix="virtual"
          />
        ))}
        {tabs.length > maxVisibleTabs && (
          <div
            className={styles.hiddenTabsIndicator}
            title={`${tabs.length - maxVisibleTabs} további tab`}
          >
            +{tabs.length - maxVisibleTabs}
          </div>
        )}
      </>
    );
  },
);

/**
 * Optimalizált tab lista közepes tab számokhoz
 */
const TabListOptimized = React.memo(
  ({
    tabs,
    tabOperations,
  }: {
    tabs: Tab[];
    tabOperations: ReturnType<typeof useTabOperations>;
  }) => {
    const batchSize = 2;
    const [renderedBatches, setRenderedBatches] = React.useState(1);

    React.useLayoutEffect(() => {
      if (tabs.length <= 5) {
        setRenderedBatches(Math.ceil(tabs.length / batchSize));
        return;
      }

      if (tabs.length > batchSize && renderedBatches * batchSize < tabs.length) {
        const rafId = requestAnimationFrame(() => {
          setRenderedBatches((prev) => prev + 1);
        });
        return () => cancelAnimationFrame(rafId);
      }
    }, [tabs.length, renderedBatches, batchSize]);

    const visibleTabs = React.useMemo(
      () => tabs.slice(0, renderedBatches * batchSize),
      [tabs, renderedBatches, batchSize],
    );

    return (
      <>
        {visibleTabs.map((tab) => (
          <TabRenderer
            key={`batch-${tab.id}`}
            tab={tab}
            tabOperations={tabOperations}
            keyPrefix="batch"
          />
        ))}
      </>
    );
  },
);

interface DraggableTabsProps {
  tabs: Tab[];
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
  onReorderTabs?: (newTabs: Tab[]) => void;
  onShowNewNews?: (tabId: string) => void;
}

/**
 * DraggableTabs - Fő komponens
 */
export const DraggableTabs: React.FC<DraggableTabsProps> = React.memo(
  ({ tabs, onAddTab, onCloseTab, onActivateTab, onReorderTabs, onShowNewNews }) => {
    // Performance mérés
    const perfStartRef = React.useRef<number>(0);
    const lastRenderTimeRef = React.useRef<number>(0);

    if (DEBUG_PERFORMANCE) {
      perfStartRef.current = performance.now();
    }

    // Callback memorizálás
    const memoizedCallbacks = React.useMemo(
      () => ({
        onAddTab,
        onCloseTab,
        onActivateTab,
        onShowNewNews,
      }),
      [onAddTab, onCloseTab, onActivateTab, onShowNewNews],
    );

    // Tab műveletek hook
    const tabOperations = useTabOperations(memoizedCallbacks);

    // Aktív tab tracking
    const activeTabId = React.useMemo(() => tabs.find((tab) => tab.active)?.id, [tabs]);

    // ✅ KIKOMMENTÁLVA: useTabScroll hook - scroll pozíció mentés teszteléséhez
    // const { tabsContainerRef } = useTabScroll({
    //   activeTab: tabs.find((tab) => tab.id === activeTabId),
    //   _tabs: tabs,
    // });
    
    // ✅ IDEIGLENES: Dummy ref a TypeScript hiba elkerüléséhez
    const tabsContainerRef = React.useRef<HTMLDivElement>(null);

    // Drag and Drop hook
    const { sensors, handleDragEnd } = useDragAndDrop({
      tabs,
      onReorderTabs: onReorderTabs || (() => {}),
    });

    // Stable tab IDs
    const tabIds = React.useMemo(() => tabs.map((tab) => tab.id), [tabs]);

    // Render stratégia meghatározása
    const renderStrategy = React.useMemo(() => {
      if (tabs.length > 10) return 'virtualized';
      if (tabs.length > OPTIMIZATION_THRESHOLD) return 'optimized';
      return 'normal';
    }, [tabs.length]);

    // Performance logging
    React.useLayoutEffect(() => {
      if (DEBUG_PERFORMANCE) {
        const now = performance.now();
        const renderTime = now - perfStartRef.current;

        // ✅ OPTIMALIZÁLT: Csak akkor loggolunk, ha a render idő jelentősen változott
        if (renderTime > 50 || Math.abs(renderTime - lastRenderTimeRef.current) > 20) {
          console.log(
            `[DraggableTabs] Render idő: ${renderTime.toFixed(2)}ms, ${tabs.length} tab, stratégia: ${renderStrategy}`,
          );
          lastRenderTimeRef.current = renderTime;
        }
      }
    });

    // Tab list renderer
    const tabListRenderer = React.useMemo(() => {
      switch (renderStrategy) {
        case 'virtualized':
          return <VirtualizedTabList tabs={tabs} tabOperations={tabOperations} />;
        case 'optimized':
          return <TabListOptimized tabs={tabs} tabOperations={tabOperations} />;
        default:
          return tabs.map((tab) => (
            <TabRenderer key={tab.id} tab={tab} tabOperations={tabOperations} keyPrefix="normal" />
          ));
      }
    }, [renderStrategy, tabs, tabOperations]);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
      >
        <div className={styles.tabsContainer}>
          <div
            ref={tabsContainerRef}
            className={`${styles.tabsList} ${renderStrategy !== 'normal' ? styles.optimized : ''}`}
            role="tablist"
            aria-label="Alkalmazás fülek"
          >
            <SortableContext items={tabIds} strategy={horizontalListSortingStrategy}>
              {tabListRenderer}
            </SortableContext>
          </div>

          <AddTab onAdd={onAddTab} />
          <ControlPanelButton />
        </div>
      </DndContext>
    );
  },
  (prevProps, nextProps) => {
    // Shallow equality check
    if (prevProps.tabs.length !== nextProps.tabs.length) return false;

    // Callback reference check
    if (
      prevProps.onAddTab !== nextProps.onAddTab ||
      prevProps.onCloseTab !== nextProps.onCloseTab ||
      prevProps.onActivateTab !== nextProps.onActivateTab ||
      prevProps.onReorderTabs !== nextProps.onReorderTabs ||
      prevProps.onShowNewNews !== nextProps.onShowNewNews
    ) {
      return false;
    }

    // Critical tab properties check
    for (let i = 0; i < prevProps.tabs.length; i++) {
      const prev = prevProps.tabs[i];
      const next = nextProps.tabs[i];
      if (prev.id !== next.id || prev.active !== next.active) {
        return false;
      }
    }

    return true;
  },
);

DraggableTabs.displayName = 'DraggableTabs';
