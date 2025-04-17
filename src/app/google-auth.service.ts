import { BehaviorSubject } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'

// google-auth.service.ts

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'
const TOKEN_KEY = 'google_token'
const TOKEN_EXPIRY_KEY = 'google_token_expiry'

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private _tokenClient: any
  public user$ = new BehaviorSubject<any | null>(null)

  constructor(private _router: Router) {
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
  }

  initializeClient() {
    this._tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          // Store token expiry time (current time + expires_in seconds)
          const expiryTime = Date.now() + (tokenResponse.expires_in * 1000)
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

          this.fetchUserInfo(tokenResponse.access_token).then(() => {
            this._router.navigate(['/'])
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
    if (this._tokenClient) {
      this._tokenClient.requestAccessToken({
        prompt: 'consent' // This ensures we get a refresh token
      })
    } else {
      console.error('Google API client not initialized')
    }
  }

  signOut() {
    this.user$.next(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    window.google?.accounts.oauth2.revoke(localStorage.getItem(TOKEN_KEY) || '', () => {
      this._router.navigate(['/'])
    })
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
    const token = localStorage.getItem(TOKEN_KEY)
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (!token || !expiryTime) return false

    // Check if token is expired
    const now = Date.now()
    const expiry = parseInt(expiryTime, 10)

    if (now >= expiry) {
      // Token expired, try to refresh
      this.signIn()
      return false
    }

    return true
  }
}