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
  public currentFlashcard: any
  public answer: string = ''
  public feedback: string = ''
  public isAnsweredCorrectly: boolean = false
  public isForceCorrectAnswer: boolean = false

  // 64th dowling and lake spruce 3313 e 64th 

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

  displayRandomFlashcard() {

    const randomIndex = Math.floor(Math.random() * this.flashcards.length)
    this.currentFlashcard = this.flashcards[randomIndex]
    this.answer = ''
    this.feedback = ''
    this.isForceCorrectAnswer = false
    console.log(this.flashcards)
    console.log(randomIndex)
    console.log(this.currentFlashcard)
  }

  submitAnswer() {
    if (this.isForceCorrectAnswer) {
      if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
        this.displayRandomFlashcard()
      } else {
        this.feedback = 'Please input the correct answer to proceed.'
      }
      return
    }

    if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
      this.feedback = 'Correct!'
      this.isAnsweredCorrectly = true
      this.updateFlashcardScore(true)
    } else {
      this.feedback = `Wrong! The correct answer is: ${this.currentFlashcard[1]}`
      this.isAnsweredCorrectly = false
      this.isForceCorrectAnswer = true
      this.updateFlashcardScore(false)
    }

    this.displayRandomFlashcard()
  }

  updateFlashcardScore(isCorrect: boolean) {
    if (isCorrect) {
      this.currentFlashcard[2] = (parseInt(this.currentFlashcard[2]) || 0) + 1
      this.currentFlashcard[4] = new Date().toISOString()
    } else {
      this.currentFlashcard[3] = (parseInt(this.currentFlashcard[3]) || 0) + 1
    }

    // Here you would update the Google Sheet with the new values.
    const spreadsheetId = '1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE'
    const range = `Words!A${this.flashcards.indexOf(this.currentFlashcard) + 2}:E`

    this._sheetsService.updateFlashcard(spreadsheetId, range, this.currentFlashcard).subscribe(() => {
      console.log('Flashcard updated successfully')
    })
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

    this._sheetsService.getFlashcards(spreadsheetId, range).subscribe((response: any) => {
      this.flashcards = response.values.filter((row: any[]) =>
        row[0] && row[1] // Ensure front side and back side are not empty
      )

      this.displayRandomFlashcard()
    })
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