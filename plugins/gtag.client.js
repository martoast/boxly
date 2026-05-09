// plugins/gtag.client.js
//
// Google Analytics — deferred until the browser is idle. Pushing the
// gtag setup behind requestIdleCallback (or a setTimeout fallback)
// gets ~150-250 KB of analytics work off the LCP path on slow
// connections. We don't lose any tracking: dataLayer + window.gtag
// stub initialize synchronously so any page_view / event calls
// queue correctly during the brief window before GTM loads.

export default defineNuxtPlugin((nuxtApp) => {
  const { gtagId } = useRuntimeConfig().public;

  if (!gtagId) {
    console.warn('Google Analytics ID is not defined');
    return;
  }

  // Synchronous: dataLayer + gtag function so callers can dispatch
  // events immediately. They'll queue until GTM loads.
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Deferred: initial config + GTM script load. Runs when the
  // browser is idle (after LCP) or after 1.5s as a fallback.
  const init = () => {
    gtag('js', new Date());
    gtag('config', gtagId, {
      page_path: window.location.pathname,
    });
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
    s.async = true;
    document.head.appendChild(s);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(init, { timeout: 3000 });
  } else {
    setTimeout(init, 1500);
  }
});
