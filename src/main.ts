import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode();
}

// Declare gapi as a global variable
declare let gapi: any;

function startApp() {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}

function loadGapi() {
  gapi.load('client:auth2', startApp);
}

function loadGooglePlatform() {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = loadGapi;
  document.body.appendChild(script);
}

loadGooglePlatform();
