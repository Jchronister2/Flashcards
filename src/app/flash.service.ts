import { BehaviorSubject } from 'rxjs'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { GoogleSheetsService } from './google-sheets.service'

interface Deck {
  id: string
  name: string
  sheets: Sheet[]
}

interface Sheet {
  name: string
  range: string
  sheetId?: number
}

@Injectable({
  providedIn: 'root'
})
export class FlashService {
  private _decks = new BehaviorSubject<Deck[]>([])
  private _currentDeck = new BehaviorSubject<Deck | null>(null)
  private _currentSheet = new BehaviorSubject<Sheet | null>(null)
  private _flashcards = new BehaviorSubject<any[]>([])
  private _currentFlashcard: any = null
  private _answer = ''
  private _feedback = ''
  private _isAnsweredCorrectly = false
  private _isForceCorrectAnswer = false
  private _previousFlashcardIndex: number | null = null

  get decks() { return this._decks.getValue() }
  get currentDeck() { return this._currentDeck.getValue() }
  get currentSheet() { return this._currentSheet.getValue() }
  get flashcards() { return this._flashcards.getValue() }
  get answer() { return this._answer }
  set answer(value: string) { this._answer = value }
  get feedback() { return this._feedback }
  set feedback(value: string) { this._feedback = value }
  get currentFlashcard() { return this._currentFlashcard }
  get isAnsweredCorrectly() { return this._isAnsweredCorrectly }
  set isAnsweredCorrectly(value: boolean) { this._isAnsweredCorrectly = value }
  get isForceCorrectAnswer() { return this._isForceCorrectAnswer }
  set isForceCorrectAnswer(value: boolean) { this._isForceCorrectAnswer = value }
  get previousFlashcardIndex() { return this._previousFlashcardIndex }
  set previousFlashcardIndex(value: number | null) { this._previousFlashcardIndex = value }

  constructor(private _sheetsService: GoogleSheetsService, private _http: HttpClient) { }

  /** Shows the next card based on spaced repetition */
  showNextFlashcard() {
    const currentDate = new Date()
    const randomChance = 1 / 20 // 1/20 chance for a completely random flashcard selection
    const windowSize = 5 // Window of top 5 flashcards based on weight

    let nextFlashcardIndex = null // Initialize next flashcard index

    // Step 1: Random Flashcard Selection (1/20 chance)
    if (Math.random() < randomChance) {
      let randomIndex = Math.floor(Math.random() * this.flashcards.length)

      // Ensure the random card is not the same as the last one
      while (randomIndex === this.previousFlashcardIndex) {
        randomIndex = Math.floor(Math.random() * this.flashcards.length)
      }

      console.log('Random card selected:', randomIndex)
      nextFlashcardIndex = randomIndex
    }
    else {
      // Step 2: Spaced Repetition Logic
      let weights = this.flashcards.map((flashcard, index) => {
        const correctCount = parseInt(flashcard[2]) || 0 // Column C
        const incorrectCount = parseInt(flashcard[3]) || 0 // Column D
        const lastCorrectDate = flashcard[4] ? new Date(flashcard[4]) : new Date(0) // Column E
        const daysSinceLastCorrect = Math.floor((currentDate.getTime() - lastCorrectDate.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate the weight for spaced repetition
        let weight = (incorrectCount + 1) * (daysSinceLastCorrect + 1) / (correctCount + 1)

        return { index, weight }
      })

      // Sort by weight in descending order (higher weight = higher priority)
      weights.sort((a, b) => b.weight - a.weight)

      // Select the top 10 (or fewer) flashcards based on weight
      const topFlashcards = weights.slice(0, Math.min(windowSize, weights.length))

      // Calculate total weight of the top flashcards (for weighted random selection)
      const totalWeight = topFlashcards.reduce((sum, flashcard) => sum + flashcard.weight, 0)

      // Select one flashcard randomly, but proportionally to its weight
      let randomValue = Math.random() * totalWeight

      for (let i = 0; i < topFlashcards.length; i++) {
        randomValue -= topFlashcards[i].weight
        if (randomValue <= 0) {
          nextFlashcardIndex = topFlashcards[i].index
          break
        }
      }

      console.log('Next flashcard index (spaced repetition):', nextFlashcardIndex)
    }

    // Step 3: Final Check to Ensure No Repetition
    if (nextFlashcardIndex === this.previousFlashcardIndex) {
      console.log('Selected flashcard is the same as previous. Selecting next available.')

      // Fallback to select a different card if the same as the previous one
      nextFlashcardIndex = (nextFlashcardIndex + 1) % this.flashcards.length
    }

    // Step 4: Update and Display the Next Flashcard
    this._currentFlashcard = this.flashcards[nextFlashcardIndex]
    this.previousFlashcardIndex = nextFlashcardIndex

    this.answer = ''
    this.feedback = ''
    this.isForceCorrectAnswer = false
  }

  submitAnswer() {
    if (this.isForceCorrectAnswer) {
      if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
        this.feedback = 'Correct! Moving on to the next question.'

        setTimeout(() => this.showNextFlashcard(), 500)
      } else {
        this.feedback = `Please input the correct answer to proceed: ${this.currentFlashcard[1]}`
      }
      return
    }

    if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
      this.feedback = 'Correct!'
      this._isAnsweredCorrectly = true
      this.updateFlashcardScore(true)

      setTimeout(() => this.showNextFlashcard(), 500)
    } else {
      this.feedback = `Wrong! The correct answer is: ${this.currentFlashcard[1]}. Please input the correct answer to proceed.`
      this._isAnsweredCorrectly = false
      this._isForceCorrectAnswer = true
      this.updateFlashcardScore(false)
    }
  }

  updateFlashcardScore(isCorrect: boolean) {
    const deck = this.currentDeck
    if (!deck || !this.currentFlashcard) return

    if (isCorrect) {
      this.currentFlashcard[2] = (parseInt(this.currentFlashcard[2]) || 0) + 1
      const now = new Date()
      this.currentFlashcard[4] = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    } else {
      this.currentFlashcard[3] = (parseInt(this.currentFlashcard[3]) || 0) + 1
    }

    const range = `${this.currentSheet?.name}!A${this.flashcards.indexOf(this.currentFlashcard) + 2}:F`

    this._sheetsService.updateFlashcard(deck.id, range, this.currentFlashcard).subscribe(() => {
      console.log('Flashcard updated successfully')
    })
  }

  loadUserSpreadsheets() {
    this._sheetsService.getUserSpreadsheets().subscribe(response => {
      const files = response.files
      const decks: Deck[] = []

      // For each spreadsheet, get its sheets
      const promises = files.map(file => {
        return this._sheetsService.getSpreadsheetDetails(file.id).subscribe(resp => {
          const sheets = resp.sheets.map(sheet => ({
            name: sheet.properties.title,
            range: `${sheet.properties.title}!A2:F`,
            sheetId: sheet.properties.sheetId
          }))
          decks.push({
            id: file.id,
            name: file.name,
            sheets
          })
          this._decks.next(decks)
        })
      })
    })
  }

  selectDeck(deckId: string) {
    const deck = this.decks.find(d => d.id === deckId)
    if (deck) {
      this._currentDeck.next(deck)
      if (deck.sheets.length > 0) {
        this.selectSheet(deck.sheets[0].name)
      }
    }
  }

  selectSheet(sheetName: string) {
    const deck = this.currentDeck
    if (!deck) return

    const sheet = deck.sheets.find(s => s.name === sheetName)
    if (sheet) {
      this._currentSheet.next(sheet)
      this.loadFlashcards()
    }
  }

  loadFlashcards() {
    const deck = this.currentDeck
    const sheet = this.currentSheet
    if (!deck || !sheet) return

    this._sheetsService.getFlashcards(deck.id, sheet.range).subscribe(response => {
      const values = response.values || []
      this._flashcards.next(values)
      if (values.length > 0) {
        this._currentFlashcard = values[0]
      }
    })
  }

  updateSheetName(oldName: string, newName: string) {
    const deck = this.currentDeck
    const sheet = this.currentSheet
    if (!deck || !sheet || !sheet.sheetId) return

    this._sheetsService.updateSheetName(deck.id, sheet.sheetId, newName).subscribe(() => {
      // Update local state
      const updatedSheets = deck.sheets.map(s =>
        s.name === oldName
          ? { ...s, name: newName, range: `${newName}!A2:F` }
          : s
      )
      const updatedDeck = { ...deck, sheets: updatedSheets }
      this._decks.next(this.decks.map(d =>
        d.id === deck.id ? updatedDeck : d
      ))
      if (this.currentSheet?.name === oldName) {
        this._currentSheet.next({ ...this.currentSheet, name: newName, range: `${newName}!A2:F` })
      }
    })
  }
}