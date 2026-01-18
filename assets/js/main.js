// Main entrypoint: bootstraps app
import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Router } from './router.js';
import { I18n } from './i18n.js';
import { UI } from './ui.js';

(async function init(){
  // Initialize storage (seed data)
  await Storage.init();

  // Initialize i18n (default Hebrew)
  I18n.init({defaultLang:'he'});

  // Initialize UI and Router
  UI.init(document.getElementById('app'));
  Router.init(UI.routeHandler);

  // If logged in, navigate to dashboard; else show login
  const me = Auth.currentUser();
  if(me){
    Router.navigate('/dashboard');
  } else {
    Router.navigate('/login');
  }
})();
