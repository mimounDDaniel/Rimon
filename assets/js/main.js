import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Router } from './router.js';
import { I18n } from './i18n.js';
import { UI } from './ui.js';

function _hideLoader() {
  const loader = document.getElementById('global-loader');
  if (!loader) return;
  loader.classList.add('loader--fade');
  // Remove after transition completes
  setTimeout(() => { 
    if (loader && loader.parentNode) {
      loader.parentNode.removeChild(loader);
    }
  }, 350);
}

(async function init() {
  try {
    // Ensure loader is visible immediately (index.html shows it by default)
    
    // Initialize storage (seed data)
    await Storage.init();
    
    // Initialize i18n with English as default
    await I18n.init({ defaultLang: 'en' });
    
    // Initialize UI and Router
    UI.init(document.getElementById('app'));
    // Bind UI.routeHandler so `this` inside routeHandler points to UI
    Router.init(UI.routeHandler.bind(UI));
    
    // Hide loader with a smooth fade
    _hideLoader();
    
    // If logged in, navigate to dashboard; else show login
    const me = Auth.currentUser();
    if (me) {
      Router.navigate('/dashboard');
    } else {
      Router.navigate('/login');
    }
  } catch (err) {
    console.error('App init error', err);
    // Try to hide loader even on error, maybe show a simple message
    _hideLoader();
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div class="p-6"><h2 class="text-lg font-semibold text-red-600">${I18n.t('initError')}</h2><pre class="mt-2 text-sm text-gray-700">${err.message || err}</pre></div>`;
    }
  }
})();