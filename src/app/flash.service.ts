import { BehaviorSubject, Observable, of } from 'rxjs'
import { map, tap } from 'rxjs/operators'

import { Injectable } from '@angular/core'

import { Deck, Flashcard, GoogleSheetsService } from './google-sheets.service'

export type StudyMode = 'flashcards' | 'review' | 'learn'

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
  private _studyMode: StudyMode = 'flashcards'
  private _isInitializing = false
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
  get studyMode() { return this._studyMode }
  get studyCards(): Flashcard[] {
    if (this._studyMode === 'review') {
      const missedCards = this.flashcards.filter(card => card.incorrectCount > 0)
      return missedCards.length ? missedCards : this.flashcards
    }

    if (this._studyMode === 'learn') {
      return [...this.flashcards].sort((a, b) => {
        const aAttempts = a.correctCount + a.incorrectCount
        const bAttempts = b.correctCount + b.incorrectCount
        return aAttempts - bAttempts
      })
    }

    return this.flashcards
  }

  constructor(private _sheetsService: GoogleSheetsService) { }

  initialize() {
    if (this._isInitializing) return
    if (this.spreadsheetId && this.decks.length) {
      if (!this.currentDeck) this.selectDeck(this.decks[0].id)
      return
    }

    this._isInitializing = true
    this._sheetsService.getUserSpreadsheet().subscribe({
      next: spreadsheetId => {
        this._spreadsheetId.next(spreadsheetId)
        this.loadDecks()
      },
      error: () => {
        this._isInitializing = false
      }
    })
  }

  private loadDecks() {
    const spreadsheetId = this.spreadsheetId
    if (!spreadsheetId) return

    this._sheetsService.getDecks(spreadsheetId).subscribe({
      next: decks => {
        this._decks.next(decks)
        this._isInitializing = false

        const lastDeckName = this._sheetsService.getLastDeckName()
        const selectedDeck = decks.find(deck => deck.name === lastDeckName)
          || decks.find(deck => deck.id === this.currentDeck?.id)
          || decks[0]

        if (selectedDeck) this.selectDeck(selectedDeck.id)
      },
      error: () => {
        this._isInitializing = false
      }
    })
  }

  setStudyMode(mode: StudyMode) {
    if (this._studyMode === mode && this.currentFlashcard) return
    this._studyMode = mode
    this.showNextFlashcard()
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
      this._currentFlashcard = null
      this.showNextFlashcard()
    })
  }

  showNextFlashcard() {
    const candidates = this.studyCards
    if (!candidates.length) {
      this._currentFlashcard = null
      this.answer = ''
      this.feedback = ''
      return
    }

    const currentDate = new Date()
    const previousCard = this.currentFlashcard
    const randomChance = 1 / 20
    const windowSize = 5
    let nextFlashcardIndex = 0

    if (candidates.length > 1 && Math.random() < randomChance) {
      const availableIndexes = candidates
        .map((_, index) => index)
        .filter(index => candidates[index] !== previousCard)
      nextFlashcardIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    } else if (candidates.length > 1) {
      const weights = candidates.map((flashcard, index) => {
        const correctCount = flashcard.correctCount
        const incorrectCount = flashcard.incorrectCount
        const lastCorrectDate = flashcard.lastCorrectDate ? new Date(flashcard.lastCorrectDate) : new Date(0)
        const daysSinceLastCorrect = Math.floor((currentDate.getTime() - lastCorrectDate.getTime()) / (1000 * 60 * 60 * 24))
        const attempts = correctCount + incorrectCount
        let weight = (incorrectCount + 1) * (daysSinceLastCorrect + 1) / (correctCount + 1)

        if (this._studyMode === 'review') weight = (incorrectCount + 1) / (correctCount + 1)
        if (this._studyMode === 'learn') weight = 1 / (attempts + 1)

        return { index, weight }
      })

      weights.sort((a, b) => b.weight - a.weight)
      const topFlashcards = weights.slice(0, Math.min(windowSize, weights.length))
      const totalWeight = topFlashcards.reduce((sum, flashcard) => sum + flashcard.weight, 0)
      let randomValue = Math.random() * totalWeight

      for (const weightedCard of topFlashcards) {
        randomValue -= weightedCard.weight
        if (randomValue <= 0) {
          nextFlashcardIndex = weightedCard.index
          break
        }
      }

      if (candidates[nextFlashcardIndex] === previousCard) {
        nextFlashcardIndex = (nextFlashcardIndex + 1) % candidates.length
      }
    }

    this._currentFlashcard = candidates[nextFlashcardIndex]
    this.previousFlashcardIndex = this.flashcards.indexOf(this._currentFlashcard)

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

  updateFlashcardScore(isCorrect: boolean, correctIncrement = 1) {
    if (!this.currentFlashcard || !this.spreadsheetId || !this.currentDeck) return

    const flashcard = { ...this.currentFlashcard }

    if (isCorrect) {
      flashcard.correctCount += correctIncrement
      const now = new Date()
      flashcard.lastCorrectDate = now.toISOString()
    } else {
      flashcard.incorrectCount++
    }

    this.updateFlashcard(this.currentFlashcard, flashcard).subscribe()
  }

  gradeCurrentCard(rating: 'again' | 'good' | 'easy') {
    if (!this.currentFlashcard) return

    const flashcard = { ...this.currentFlashcard }
    if (rating === 'again') {
      flashcard.incorrectCount++
      this.feedback = 'Marked for another review.'
    } else {
      flashcard.correctCount += rating === 'easy' ? 2 : 1
      flashcard.lastCorrectDate = new Date().toISOString()
      this.feedback = rating === 'easy' ? 'Marked easy.' : 'Marked good.'
    }

    this.updateFlashcard(this.currentFlashcard, flashcard).subscribe(() => {
      setTimeout(() => this.showNextFlashcard(), 350)
    })
  }

  updateFlashcard(card: Flashcard, updatedFlashcard: Flashcard): Observable<void> {
    const index = this.flashcards.indexOf(card)
    if (index < 0 || !this.spreadsheetId || !this.currentDeck) return of(undefined)

    return this._sheetsService.updateFlashcard(
      this.spreadsheetId,
      this.currentDeck.name,
      index,
      updatedFlashcard
    ).pipe(
      tap(() => {
        const updatedFlashcards = [...this.flashcards]
        updatedFlashcards[index] = { ...updatedFlashcard }
        this._flashcards.next(updatedFlashcards)
        if (this._currentFlashcard === card) this._currentFlashcard = updatedFlashcards[index]
      }),
      map(() => undefined)
    )
  }

  deleteFlashcard(card: Flashcard): Observable<void> {
    const index = this.flashcards.indexOf(card)
    if (index < 0 || !this.spreadsheetId || !this.currentDeck) return of(undefined)

    return this._sheetsService.deleteFlashcard(
      this.spreadsheetId,
      this.currentDeck.name,
      index
    ).pipe(
      tap(() => {
        const updatedFlashcards = this.flashcards.filter((_, cardIndex) => cardIndex !== index)
        this._flashcards.next(updatedFlashcards)
        if (this._currentFlashcard === card) {
          this._currentFlashcard = null
          this.showNextFlashcard()
        }
      }),
      map(() => undefined)
    )
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
        this._sheetsService.setLastDeckName(newName)
      }
    })
  }

  createFlashcard(front: string, back: string, tags: string = ''): Observable<void> {
    if (!this.spreadsheetId || !this.currentDeck) return of(undefined)

    const newFlashcard: Flashcard = {
      front,
      back,
      correctCount: 0,
      incorrectCount: 0,
      lastCorrectDate: null,
      tags
    }

    return this._sheetsService.createFlashcard(this.spreadsheetId, this.currentDeck.name, newFlashcard).pipe(
      tap(() => {
        this._flashcards.next([...this.flashcards, newFlashcard])
        if (!this._currentFlashcard) this.showNextFlashcard()
      }),
      map(() => undefined)
    )
  }
}
