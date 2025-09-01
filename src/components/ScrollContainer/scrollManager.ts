// src/utils/scrollManager.ts

export type ScrollReason = 'pagination' | 'tabSwitch' | 'external' | undefined;

export interface ScrollTarget {
  element: Element;
  priority: number;
  name: string;
}

export interface ScrollOptions {
  reason: ScrollReason;
  behavior?: ScrollBehavior;
  offset?: number;
}

export class ScrollManager {
  /**
   * Visszaadja a scroll célpontokat prioritási sorrendben
   */
  static findScrollTargets(): ScrollTarget[] {
    const targets: ScrollTarget[] = [
      { element: document.querySelector('[class*="panel"]')!, priority: 1, name: 'panel' },
      { element: document.querySelector('[class*="panelContent"]')!, priority: 2, name: 'panelContent' },
      { element: document.querySelector('[data-testid="scroll-container"]')!, priority: 3, name: 'scrollContainer' },
      { element: document.querySelector('._contentWithTabs_1e62z_435')!, priority: 4, name: 'legacyContentWithTabs' },
      { element: document.querySelector('[class*="contentWithTabs"]')!, priority: 5, name: 'contentWithTabs' },
      { element: document.querySelector('main')!, priority: 6, name: 'main' },
    ].filter(t => !!t.element);
    console.log('[ScrollManager] findScrollTargets:', targets.map(t => t.name));
    return targets.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Scrolloz az első megfelelő targetre
   */
  static scrollToTop(targets: ScrollTarget[], options: ScrollOptions): boolean {
    for (const { element, name } of targets) {
      if (element.scrollHeight > element.clientHeight) {
        (element as HTMLElement).scrollTo({ top: 0, behavior: options.behavior || 'smooth' });
        console.log(`[ScrollManager] ✅ Scroll success → ${name}`);
        return true;
      }
    }
    console.log('[ScrollManager] ❌ ScrollToTop: nem talált megfelelő targetet');
    return false;
  }

  /**
   * OffsetTop alapú scroll fallback
   */
  static scrollToPanelOffset(options: ScrollOptions): boolean {
    const panel = document.querySelector('[class*="panel"]') as HTMLElement;
    if (!panel) return false;

    const offsetTop = Math.max(0, panel.offsetTop - (options.offset || 20));
    window.scrollTo({ top: offsetTop, behavior: options.behavior || 'smooth' });

    console.log(`[ScrollManager] Window scroll fallback → offsetTop ${offsetTop}`);
    return true;
  }

  /**
   * Teljes scrollToTop folyamat logikája
   */
  static performScroll(options: ScrollOptions): void {
    console.log('[ScrollManager] performScroll called with options:', options);
    const targets = this.findScrollTargets();
    const scrolled = this.scrollToTop(targets, options);
    if (!scrolled) {
      this.scrollToPanelOffset(options);
    }
  }
} 