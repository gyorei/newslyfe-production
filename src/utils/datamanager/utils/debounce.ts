/**
 * Debounce segédfüggvény a News alkalmazáshoz
 */

type AnyFunction = (...args: unknown[]) => unknown;
type ThisParameterType<T> = T extends (this: infer U, ...args: unknown[]) => unknown ? U : unknown;

/**
 * Debounce wrapper függvény, ami késlelteti egy függvény végrehajtását,
 * amíg a hívások közötti időköz egy megadott küszöbérték alá nem csökken.
 *
 * @param func - Az eredeti függvény, amit debounce-olni akarunk
 * @param wait - Várakozási idő milliszekundumban
 * @param immediate - Ha true, a függvényt azonnal végrehajtja a debounce ciklus elején
 */
export function debounce<T extends AnyFunction>(
  func: T,
  wait: number,
  immediate: boolean = false,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const later = (): void => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

/**
 * Debounce wrapper, ami Promise-t ad vissza
 *
 * @param func - Az eredeti aszinkron függvény
 * @param wait - Várakozási idő milliszekundumban
 */
export function asyncDebounce<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: number | null = null;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;

  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    // Ha már van függőben lévő promise, visszaadjuk azt
    if (pendingPromise) {
      return pendingPromise;
    }

    // Az első hívásnál vagy timeout utáni hívásnál új Promise-t készítünk
    pendingPromise = new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      // Töröljük az előző timeout-ot, ha volt
      if (timeout !== null) {
        clearTimeout(timeout);
      }

      // Új timeout beállítása
      timeout = window.setTimeout(() => {
        // Függvény végrehajtása a timeout lejárta után
        func
          .apply(this, args)
          .then((result) => {
            pendingPromise = null;
            resolve(result as Awaited<ReturnType<T>>);
          })
          .catch((error: unknown) => {
            pendingPromise = null;
            reject(error);
          });
      }, wait);
    });

    return pendingPromise;
  };
}

/**
 * Throttle függvény: korlátozza egy függvény hívási gyakoriságát
 */
export function throttle<T extends AnyFunction>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastFunc: (() => void) | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs && lastFunc) {
          lastFunc();
          lastArgs = null;
          lastFunc = null;
        }
      }, limit);
    } else {
      // Helyette closure-t használunk this-sel
      lastArgs = args;
      lastFunc = () => func.apply(this, args);
    }
  };
}
