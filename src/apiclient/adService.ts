/* ADSENSE TEMPORARILY DISABLED: Script injection blocked to prevent scroll issues
export function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Extra check for any AdSense script
    if (document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      resolve();
      return;
    }
    // Existing check (if any)
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}
*/

// TEMPORARY STUB: Returns immediately resolved promise
export function injectScript(src: string): Promise<void> {
  console.warn('⚠️ AdSense script injection disabled for scroll fix');
  return Promise.resolve();
} 