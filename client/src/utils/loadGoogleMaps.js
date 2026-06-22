let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const callbackName = '__farm2homeGoogleMapsInit';
      window[callbackName] = () => {
        delete window[callbackName];
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps Places library failed to load'));
        }
      };

      const existing = document.querySelector('script[data-google-maps]');
      if (existing) {
        existing.addEventListener('load', () => window[callbackName]?.());
        existing.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
        return;
      }

      const script = document.createElement('script');
      script.dataset.googleMaps = 'true';
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
      script.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
