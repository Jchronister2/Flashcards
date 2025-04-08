import { BehaviorSubject } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router } from '@angular/router'

// google-auth.service.ts

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'

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
      const token = localStorage.getItem('google_token')
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
      this._tokenClient.requestAccessToken()
    } else {
      console.error('Google API client not initialized')
    }
  }

  signOut() {
    this.user$.next(null)
    localStorage.removeItem('google_token')
    window.google?.accounts.oauth2.revoke(localStorage.getItem('google_token') || '', () => {
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
        localStorage.setItem('google_token', accessToken)
      })
      .catch(error => {
        console.error('Error fetching user info:', error)
        this.signOut()
      })
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_token')
  }
}