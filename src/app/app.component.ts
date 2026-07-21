import { FlashService } from 'src/app/flash.service'

import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import { GoogleAuthService } from './google-auth.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private readonly THEME_KEY = 'flashcards_theme'
  isDarkMode = false
  showCreateDeckForm = false
  newDeckName = ''

  get flashcards() { return this._flashService.flashcards }
  get decks() { return this._flashService.decks }
  get currentDeck() { return this._flashService.currentDeck }
  get isAuthenticated(): boolean { return this._authService.isAuthenticated() }
  get user() { return this._authService.user$.getValue() }
  get dueCount() { return this.flashcards.length || 0 }
  get isStudyRoute() { return this._router.url.includes('/study') }
  get isDeckRoute() { return this._router.url.includes('/decks') }
  get isReviewMode() { return this.isStudyRoute && this._router.url.includes('mode=review') }
  get isLearnMode() { return this.isStudyRoute && this._router.url.includes('mode=learn') }
  get isFlashcardsMode() { return this.isStudyRoute && !this.isReviewMode && !this.isLearnMode }
  get syncLabel() { return this._authService.isPreviewMode ? 'Preview data' : 'Google Sheets connected' }
  get syncIcon() { return this._authService.isPreviewMode ? 'science' : 'cloud_done' }

  constructor(
    private _authService: GoogleAuthService,
    private _flashService: FlashService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.isDarkMode = localStorage.getItem(this.THEME_KEY) === 'dark'

    if (this._authService.isAuthenticated()) {
      this._authService.initializeClient()
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    localStorage.setItem(this.THEME_KEY, this.isDarkMode ? 'dark' : 'light')
  }

  selectDeck(deckId: number) {
    this._flashService.selectDeck(deckId)
    this._router.navigate(['/study'])
  }

  openCreateDeckForm() {
    this.showCreateDeckForm = true
    this.newDeckName = ''
  }

  closeCreateDeckForm() {
    this.showCreateDeckForm = false
    this.newDeckName = ''
  }

  createDeck() {
    const name = this.newDeckName.trim()
    if (!name) return

    this._flashService.createDeck(name)
    this.closeCreateDeckForm()
  }

  onLogin() {
    this._authService.signIn()
  }

  onLogout() {
    this._authService.signOut()
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
