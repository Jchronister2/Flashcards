import { Component, OnInit } from '@angular/core'

import { GoogleAuthService } from './google-auth.service'
import { GoogleSheetsService } from './google-sheets.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public flashcards: string[][] = []

  get isAuthenticated(): boolean { return this._authService.isAuthenticated() }
  get user() { return this._authService.user$.getValue() }

  constructor(private _authService: GoogleAuthService, private _sheetsService: GoogleSheetsService) { }

  ngOnInit() {
    if (this._authService.isAuthenticated()) {
      this._authService.initializeClient() // Initialize client on load
      this.loadFlashcards()
      this._authService.fetchUserInfo(localStorage.getItem('google_token') || '')
    }
  }

  onLogin() {
    this._authService.signIn()
  }

  onLogout() {
    this._authService.signOut()
    this.flashcards = []
  }

  loadFlashcards() {
    const spreadsheetId = '1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE'
    const range = 'Words!A2:E'

    this._sheetsService.getFlashcards(spreadsheetId, range)
      .subscribe(data => this.flashcards = data.values || [])
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