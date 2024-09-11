import { FlashService } from 'src/app/flash.service'

import { Component, OnInit } from '@angular/core'

import { GoogleAuthService } from './google-auth.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  get flashcards() { return this._flashService.flashcards }
  get isAuthenticated(): boolean { return this._authService.isAuthenticated() }
  get user() { return this._authService.user$.getValue() }

  constructor(private _authService: GoogleAuthService, private _flashService: FlashService) { }

  ngOnInit() {
    if (this._authService.isAuthenticated()) {
      this._authService.initializeClient() // Initialize client on load
      this._authService.fetchUserInfo(localStorage.getItem('google_token') || '')
    } else {
      this._authService.user$.subscribe(user => {
        if (user) {
          this._authService.fetchUserInfo(localStorage.getItem('google_token') || '')
        }
      })
    }
  }

  onLogin() {
    this._authService.signIn()
  }

  onLogout() {
    this._authService.signOut()
  }

  getProfileImageUrl(): string {
    const user = this._authService.user$.getValue()

    return user ? user.picture : ''
  }

  getProfileName(): string {
    const user = this._authService.user$.getValue()

    return user ? user.name : ''
  }
}