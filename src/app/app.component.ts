import { FlashService } from 'src/app/flash.service'

import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import { GoogleAuthService } from './google-auth.service'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  private readonly THEME_KEY = 'flashcards_theme'
  isDarkMode = false

  get flashcards() { return this._flashService.flashcards }
  get decks() { return this._flashService.decks }
  get currentDeck() { return this._flashService.currentDeck }
  get isAuthenticated(): boolean { return this._authService.isAuthenticated() }
  get isDemoMode(): boolean { return this._flashService.isDemoMode }
  get user() { return this._authService.user$.getValue() }
  get dueCount() { return this.flashcards.length }

  constructor(
    private _authService: GoogleAuthService,
    private _flashService: FlashService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.isDarkMode = localStorage.getItem(this.THEME_KEY) === 'dark'
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    localStorage.setItem(this.THEME_KEY, this.isDarkMode ? 'dark' : 'light')
  }

  onDeckSelect(deckId: number) {
    this._flashService.selectDeck(deckId)
    this._router.navigate(['/study'])
  }

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
