import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

// Declare global variables
declare global {
  interface Window {
    google: any
  }
}

function startApp() {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err))
}

function loadGoogleIdentity() {
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => {
    startApp()
  }
  document.head.appendChild(script)
}

loadGoogleIdentity()
