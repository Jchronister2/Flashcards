import { GoogleSheetsService } from 'src/app/google-sheets.service'

import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class FlashService {
  public flashcards: string[][] = []
  public currentFlashcard: any
  public answer: string = ''
  public feedback: string = ''
  public isAnsweredCorrectly: boolean = false
  public isForceCorrectAnswer: boolean = false

  constructor(private _sheetsService: GoogleSheetsService) { }

  displayRandomFlashcard() {
    const randomIndex = Math.floor(Math.random() * this.flashcards.length)

    this.currentFlashcard = this.flashcards[randomIndex]
    this.answer = ''
    this.feedback = ''
    this.isForceCorrectAnswer = false
  }

  submitAnswer() {
    if (this.isForceCorrectAnswer) {
      if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
        this.feedback = 'Correct! Moving on to the next question.'

        setTimeout(() => this.displayRandomFlashcard(), 500)
      } else {
        this.feedback = `Please input the correct answer to proceed: ${this.currentFlashcard[1]}`
      }
      return
    }

    if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
      this.feedback = 'Correct!'
      this.isAnsweredCorrectly = true
      this.updateFlashcardScore(true)

      setTimeout(() => this.displayRandomFlashcard(), 500)
    } else {
      this.feedback = `Wrong! The correct answer is: ${this.currentFlashcard[1]}. Please input the correct answer to proceed.`
      this.isAnsweredCorrectly = false
      this.isForceCorrectAnswer = true
      this.updateFlashcardScore(false)
    }
  }

  updateFlashcardScore(isCorrect: boolean) {
    if (isCorrect) {
      this.currentFlashcard[2] = (parseInt(this.currentFlashcard[2]) || 0) + 1
      const now = new Date()
      this.currentFlashcard[4] = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
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
}