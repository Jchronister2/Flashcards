import { BehaviorSubject } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { environment } from '../environments/environment'
import { RuntimeConfigService } from './runtime-config.service'

// google-auth.service.ts

const TOKEN_KEY = 'google_token'
const TOKEN_EXPIRY_KEY = 'google_token_expiry'

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private _tokenClient: any
  private _clientReady: Promise<void> | null = null
  public user$ = new BehaviorSubject<any | null>(null)
  private _lastRoute: string | null = null

  constructor(
    private _router: Router,
    private _runtimeConfig: RuntimeConfigService
  ) {
    if (this._runtimeConfig.isDemoMode) {
      this.user$.next({ name: 'Public demo', email: 'Sample data' })
      return
    }

    if (!this._runtimeConfig.googleClientId) {
      console.error('Google OAuth is not configured. Add src/assets/config.local.js from the checked-in example.')
    } else {
      this._clientReady = this.loadGoogleIdentityClient()
        .then(() => this.initializeClient())
      this._clientReady.catch(error => console.error('Unable to load Google OAuth:', error))
    }

    // If already authenticated, fetch user info
    if (this.isAuthenticated()) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        this.fetchUserInfo(token)
      }
    }

    // Check token expiration periodically
    setInterval(() => this.checkTokenExpiration(), 60000) // Check every minute
  }

  private loadGoogleIdentityClient(): Promise<void> {
    if (window.google?.accounts?.oauth2) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity-client]')
      const script = existing ?? document.createElement('script')

      const handleLoad = () => resolve()
      const handleError = () => reject(new Error('Google Identity Services failed to load'))
      script.addEventListener('load', handleLoad, { once: true })
      script.addEventListener('error', handleError, { once: true })

      if (!existing) {
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.dataset['googleIdentityClient'] = 'true'
        document.head.appendChild(script)
      }
    })
  }

  private checkTokenExpiration() {
    if (this.isAuthenticated()) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        this.fetchUserInfo(token).catch(() => {
          this.signOut()
        })
      }
    }
  }

  initializeClient() {
    if (this._runtimeConfig.isDemoMode) return

    this._tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this._runtimeConfig.googleClientId,
      scope: environment.googleScopes,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          // Store token expiry time (current time + expires_in seconds)
          const expiryTime = Date.now() + (tokenResponse.expires_in * 1000)
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

          this.fetchUserInfo(tokenResponse.access_token).then(() => {
            if (this._lastRoute) {
              this._router.navigate([this._lastRoute])
              this._lastRoute = null
            } else {
              this._router.navigate(['/'])
            }
          })
        }
      },
      error_callback: (error: any) => {
        console.error('Error getting token:', error)
        this.signOut()
      }
    })
  }

  async signIn() {
    if (this._runtimeConfig.isDemoMode) {
      this._router.navigate(['/study'])
      return
    }

    try {
      await this._clientReady
    } catch {
      return
    }

    if (this._tokenClient) {
      this._tokenClient.requestAccessToken({
        prompt: 'consent'
      })
    } else {
      console.error('Google API client not initialized')
    }
  }

  signOut() {
    if (this._runtimeConfig.isDemoMode) return

    // Store the current route before signing out
    if (this._router.url !== '/login') {
      this._lastRoute = this._router.url
    }
    const token = localStorage.getItem(TOKEN_KEY)
    this.user$.next(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    if (!token) {
      this._router.navigate(['/login'])
      return
    }
    window.google?.accounts.oauth2.revoke(token, () => this._router.navigate(['/login']))
  }

  fetchUserInfo(accessToken: string) {
    return fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + accessToken)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(profile => {
        this.user$.next(profile)
        localStorage.setItem(TOKEN_KEY, accessToken)
      })
      .catch(error => {
        console.error('Error fetching user info:', error)
        this.signOut()
      })
  }

  isAuthenticated(): boolean {
    if (this._runtimeConfig.isDemoMode) return true

    const token = localStorage.getItem(TOKEN_KEY)
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (!token || !expiryTime) return false

    const now = Date.now()
    const expiry = parseInt(expiryTime, 10)

    if (now >= expiry) {
      return false
    }

    return true
  }
}
