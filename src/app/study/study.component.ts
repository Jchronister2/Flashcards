import { Component, OnInit } from '@angular/core'

import { FlashService } from '../flash.service'
import { Flashcard, GoogleSheetsService } from '../google-sheets.service'

@Component({
    selector: 'app-study',
    templateUrl: './study.component.html',
    styleUrls: ['./study.component.css'],
    standalone: false
})
export class StudyComponent implements OnInit {
  public showEditModal = false
  public editCard: Flashcard | null = null

  get decks() {
    return this._flashService.decks
  }

  get currentDeck() {
    return this._flashService.currentDeck
  }

  get currentFlashcard() {
    return this._flashService.currentFlashcard
  }

  get answer() {
    return this._flashService.answer
  }

  set answer(value: string) {
    this._flashService.answer = value
  }

  get feedback() {
    return this._flashService.feedback
  }

  get flashcards() {
    return this._flashService.flashcards
  }

  get isAnsweredCorrectly() {
    return this._flashService.isAnsweredCorrectly
  }

  get isForceCorrectAnswer() {
    return this._flashService.isForceCorrectAnswer
  }

  get tags(): string[] {
    const currentTags = this.currentFlashcard?.tags || ''
    return currentTags ? currentTags.split(',').map(tag => tag.trim()) : []
  }

  constructor(
    private _flashService: FlashService,
    private _sheetsService: GoogleSheetsService
  ) { }

  ngOnInit() {
    this._flashService.initialize()
  }

  onDeckChange(deckId: number | string) {
    const parsedDeckId = Number(deckId)
    if (parsedDeckId && parsedDeckId !== this.currentDeck?.id) {
      this._flashService.selectDeck(parsedDeckId)
    }
  }

  submitAnswer() {
    this._flashService.submitAnswer()
    this.answer = ''
  }

  openEditModal() {
    if (!this.currentFlashcard) return
    this.showEditModal = true
    this.editCard = { ...this.currentFlashcard }
  }

  hideEditModal() {
    this.showEditModal = false
    this.editCard = null
  }

  saveEdit(updatedFlashcard: Flashcard) {
    if (!this.currentFlashcard) return

    const index = this.flashcards.indexOf(this.currentFlashcard)
    this._sheetsService.updateFlashcard(
      this._flashService.spreadsheetId!,
      this.currentDeck!.name,
      index,
      updatedFlashcard
    ).subscribe(() => {
      this._flashService.selectDeck(this.currentDeck!.id)
      this.hideEditModal()
    })
  }
}
