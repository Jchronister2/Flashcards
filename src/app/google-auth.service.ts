import { BehaviorSubject } from 'rxjs'

// google-auth.service.ts
import { Injectable } from '@angular/core'

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  public user$ = new BehaviorSubject<any | null>(null);
  private client: google.accounts.oauth2.TokenClient | undefined;

  constructor() {
    this.initializeClient();
  }

  initializeClient() {
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse) => {
        this.fetchUserInfo(tokenResponse.access_token);
      },
    });
  }

  signIn() {
    this.client?.requestAccessToken();
  }

  signOut() {
    this.user$.next(null);
    localStorage.removeItem('google_token');
  }

  fetchUserInfo(accessToken: string) {
    fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + accessToken)
      .then(response => response.json())
      .then(profile => {
        this.user$.next(profile);
        console.log(profile);
        localStorage.setItem('google_token', accessToken);
      });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('google_token');
  }
}