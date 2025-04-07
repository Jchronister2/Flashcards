import { BehaviorSubject } from 'rxjs'

// google-auth.service.ts
import { Injectable } from '@angular/core'

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private _client: google.accounts.oauth2.TokenClient | undefined
  public user$ = new BehaviorSubject<any | null>(null)

  constructor() {
    this.initializeClient()

    // If already authenticated, fetch user info
    if (this.isAuthenticated()) {
      const token = localStorage.getItem('google_token')
      if (token) {
        this.fetchUserInfo(token)
      }
    }
  }

  initializeClient() {
    this._client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          this.fetchUserInfo(tokenResponse.access_token)
        }
      }
    })
  }

  signIn() {
    this._client?.requestAccessToken()
  }

  signOut() {
    this.user$.next(null)
    localStorage.removeItem('google_token')
  }

  fetchUserInfo(accessToken: string) {
    fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + accessToken)
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
        this.signOut()
      })
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_token')
  }
}