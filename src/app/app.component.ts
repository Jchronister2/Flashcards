import { FlashService } from 'src/app/flash.service'

import { Component } from '@angular/core'

import { GoogleAuthService } from './google-auth.service'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  get flashcards() { return this._flashService.flashcards }
  get isAuthenticated(): boolean { return this._authService.isAuthenticated() }
  get isDemoMode(): boolean { return this._flashService.isDemoMode }
  get user() { return this._authService.user$.getValue() }

  constructor(private _authService: GoogleAuthService, private _flashService: FlashService) { }

  onLogin() {
    this._authService.signIn()
  }

  onLogout() {
    this._authService.signOut()
  }

  onResetDemoData() {
    this._flashService.resetDemoData()
  }

  getProfileImageUrl(): string {
    const user = this._authService.user$.getValue()
    return user?.picture || ''
  }

  getProfileName(): string {
    const user = this._authService.user$.getValue()
    return user?.name || ''
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement
    img.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
  }
}
