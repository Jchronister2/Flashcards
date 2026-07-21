import { BehaviorSubject } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'

// google-auth.service.ts

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'
const TOKEN_KEY = 'google_token'
const TOKEN_EXPIRY_KEY = 'google_token_expiry'
const PREVIEW_TOKEN = 'dev-preview-token'

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private _tokenClient: any
  public user$ = new BehaviorSubject<any | null>(null)
  private _lastRoute: string | null = null

  constructor(private _router: Router) {
    this.importTokenFromUrlFragment()

    // Wait for Google API to be ready
    if (window.google) {
      this.initializeClient()
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          this.initializeClient()
          clearInterval(checkGoogle)
        }
      }, 100)
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

  get isPreviewMode(): boolean {
    const token = localStorage.getItem(TOKEN_KEY)
    return !!token && this.isPreviewToken(token)
  }

  private importTokenFromUrlFragment() {
    if (!this.isLocalDevOrigin() || !window.location.hash) return

    const params = new URLSearchParams(window.location.hash.substring(1))
    const token = params.get('flashcards_token')
    const expiry = params.get('flashcards_expiry')

    if (!token || !expiry) return

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry)
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search)

    if (this.isPreviewToken(token)) {
      this.user$.next(this.getPreviewUser())
      this._router.navigate(['/'])
      return
    }

    this.fetchUserInfo(token).then(() => {
      this._router.navigate(['/'])
    })
  }

  private isLocalDevOrigin(): boolean {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  }

  private isPreviewToken(token: string): boolean {
    return this.isLocalDevOrigin() && token === PREVIEW_TOKEN
  }

  private getPreviewUser() {
    return {
      name: 'Tyler Loe',
      email: 'preview@flashcards.local',
      picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }
  }

  createCodexPreviewLoginUrl(): string | null {
    if (!this.isLocalDevOrigin()) return null

    const token = localStorage.getItem(TOKEN_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (!token || !expiry) return null

    const params = new URLSearchParams({
      flashcards_token: token,
      flashcards_expiry: expiry,
    })

    return `${window.location.origin}/login#${params.toString()}`
  }

  private checkTokenExpiration() {
    if (this.isAuthenticated()) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && this.isPreviewToken(token)) {
        this.user$.next(this.getPreviewUser())
        return
      }
      if (token) {
        this.fetchUserInfo(token).catch(() => {
          this.signOut()
        })
      }
    }
  }

  initializeClient() {
    const oauth2 = window.google.accounts.oauth2 as any
    this._tokenClient = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
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

  signIn() {
    if (!this._tokenClient && window.google) {
      this.initializeClient()
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
    // Store the current route before signing out
    if (this._router.url !== '/login') {
      this._lastRoute = this._router.url
    }
    const token = localStorage.getItem(TOKEN_KEY)
    this.user$.next(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    this._router.navigate(['/login'])

    const oauth2 = window.google?.accounts?.oauth2 as any
    if (token && oauth2?.revoke) {
      try {
        oauth2.revoke(token, () => undefined)
      } catch {
      }
    }
  }

  fetchUserInfo(accessToken: string) {
    if (this.isPreviewToken(accessToken)) {
      this.user$.next(this.getPreviewUser())
      return Promise.resolve(this.getPreviewUser())
    }

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
