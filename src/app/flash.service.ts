import { BehaviorSubject } from 'rxjs'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { Deck, Flashcard, GoogleSheetsService } from './google-sheets.service'

@Injectable({
  providedIn: 'root'
})
export class FlashService {
  private _spreadsheetId = new BehaviorSubject<string | null>(null)
  private _decks = new BehaviorSubject<Deck[]>([])
  private _currentDeck = new BehaviorSubject<Deck | null>(null)
  private _flashcards = new BehaviorSubject<Flashcard[]>([])
  private _currentFlashcard: Flashcard | null = null
  private _answer = ''
  private _feedback = ''
  private _isAnsweredCorrectly = false
  private _isForceCorrectAnswer = false
  private _previousFlashcardIndex: number | null = null
  private readonly LAST_SELECTED_DECK_KEY = 'lastSelectedDeckId'

  get spreadsheetId() { return this._spreadsheetId.getValue() }
  get decks() { return this._decks.getValue() }
  get currentDeck() { return this._currentDeck.getValue() }
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

  initialize() {
    this._sheetsService.getUserSpreadsheet().subscribe(spreadsheetId => {
      this._spreadsheetId.next(spreadsheetId)
      this.loadDecks()
    })
  }

  private loadDecks() {
    const spreadsheetId = this.spreadsheetId
    if (!spreadsheetId) return

    this._sheetsService.getDecks(spreadsheetId).subscribe(decks => {
      this._decks.next(decks)

      // Try to restore last selected deck
      const lastDeckName = this._sheetsService.getLastDeckName()
      if (lastDeckName) {
        const deck = decks.find(d => d.name === lastDeckName)
        if (deck) {
          this.selectDeck(deck.id)
        }
      }
    })
  }

  selectDeck(deckId: number) {
    const deck = this.decks.find(d => d.id === deckId)
    if (!deck || !this.spreadsheetId) return

    this._currentDeck.next(deck)
    localStorage.setItem(this.LAST_SELECTED_DECK_KEY, deckId.toString())
    this._sheetsService.setLastDeckName(deck.name)
    this.loadFlashcards()
  }

  getLastSelectedDeckId(): number | null {
    const lastId = localStorage.getItem(this.LAST_SELECTED_DECK_KEY)
    return lastId ? parseInt(lastId, 10) : null
  }

  private loadFlashcards() {
    const spreadsheetId = this.spreadsheetId
    const deck = this.currentDeck
    if (!spreadsheetId || !deck) return

    this._sheetsService.getFlashcards(spreadsheetId, deck.name).subscribe(flashcards => {
      this._flashcards.next(flashcards)
      if (flashcards.length > 0) {
        this.showNextFlashcard()
      }
    })
  }

  showNextFlashcard() {
    const currentDate = new Date()
    const randomChance = 1 / 20 // 1/20 chance for a completely random flashcard selection
    const windowSize = 5 // Window of top 5 flashcards based on weight

    let nextFlashcardIndex = null

    // Step 1: Random Flashcard Selection (1/20 chance)
    if (Math.random() < randomChance) {
      let randomIndex = Math.floor(Math.random() * this.flashcards.length)

      // Ensure the random card is not the same as the last one
      while (randomIndex === this.previousFlashcardIndex) {
        randomIndex = Math.floor(Math.random() * this.flashcards.length)
      }

      nextFlashcardIndex = randomIndex
    }
    else {
      // Step 2: Spaced Repetition Logic
      let weights = this.flashcards.map((flashcard, index) => {
        const correctCount = flashcard.correctCount
        const incorrectCount = flashcard.incorrectCount
        const lastCorrectDate = flashcard.lastCorrectDate ? new Date(flashcard.lastCorrectDate) : new Date(0)
        const daysSinceLastCorrect = Math.floor((currentDate.getTime() - lastCorrectDate.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate the weight for spaced repetition
        let weight = (incorrectCount + 1) * (daysSinceLastCorrect + 1) / (correctCount + 1)

        return { index, weight }
      })

      // Sort by weight in descending order (higher weight = higher priority)
      weights.sort((a, b) => b.weight - a.weight)

      // Select the top flashcards based on weight
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
    }

    // Step 3: Final Check to Ensure No Repetition
    if (nextFlashcardIndex === this.previousFlashcardIndex) {
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
    if (!this.currentFlashcard) return

    if (this.isForceCorrectAnswer) {
      if (this.answer.toLowerCase() === this.currentFlashcard.back.toLowerCase()) {
        this.feedback = 'Correct! Moving on to the next question.'
        setTimeout(() => this.showNextFlashcard(), 500)
      } else {
        this.feedback = `Please input the correct answer to proceed: ${this.currentFlashcard.back}`
      }
      return
    }

    if (this.answer.toLowerCase() === this.currentFlashcard.back.toLowerCase()) {
      this.feedback = 'Correct!'
      this._isAnsweredCorrectly = true
      this.updateFlashcardScore(true)
      setTimeout(() => this.showNextFlashcard(), 500)
    } else {
      this.feedback = `Wrong! The correct answer is: ${this.currentFlashcard.back}. Please input the correct answer to proceed.`
      this._isAnsweredCorrectly = false
      this._isForceCorrectAnswer = true
      this.updateFlashcardScore(false)
    }
  }

  updateFlashcardScore(isCorrect: boolean) {
    if (!this.currentFlashcard || !this.spreadsheetId || !this.currentDeck) return

    const flashcard = { ...this.currentFlashcard }

    if (isCorrect) {
      flashcard.correctCount++
      const now = new Date()
      flashcard.lastCorrectDate = now.toISOString()
    } else {
      flashcard.incorrectCount++
    }

    const index = this.flashcards.indexOf(this.currentFlashcard)
    this._sheetsService.updateFlashcard(
      this.spreadsheetId,
      this.currentDeck.name,
      index,
      flashcard
    ).subscribe(() => {
      // Update the flashcard in our local array
      const updatedFlashcards = [...this.flashcards]
      updatedFlashcards[index] = flashcard
      this._flashcards.next(updatedFlashcards)
      this._currentFlashcard = flashcard
    })
  }

  createDeck(name: string) {
    if (!this.spreadsheetId) return

    this._sheetsService.createDeck(this.spreadsheetId, name).subscribe(deck => {
      this._decks.next([...this.decks, deck])
      this.selectDeck(deck.id)
    })
  }

  renameDeck(deckId: number, newName: string) {
    if (!this.spreadsheetId) return

    this._sheetsService.renameDeck(this.spreadsheetId, deckId, newName).subscribe(() => {
      const updatedDecks = this.decks.map(deck =>
        deck.id === deckId ? { ...deck, name: newName } : deck
      )
      this._decks.next(updatedDecks)

      if (this.currentDeck?.id === deckId) {
        this._currentDeck.next({ ...this.currentDeck, name: newName })
      }
    })
  }
}