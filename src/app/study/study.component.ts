import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'

import { FlashService } from '../flash.service'
import { Deck, Flashcard, GoogleSheetsService } from '../google-sheets.service'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css']
})
export class StudyComponent implements OnInit {
  @ViewChild('tagInput') tagInputElement!: ElementRef

  public makingTag = false
  public selectedDeckId: number | null = null

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

    // Try to get the last selected deck first
    const lastSelectedDeckId = this._flashService.getLastSelectedDeckId()
    if (lastSelectedDeckId) {
      this.selectedDeckId = lastSelectedDeckId
      this._flashService.selectDeck(lastSelectedDeckId)
    } else if (this.currentDeck) {
      // Fallback to current deck if no last selected
      this.selectedDeckId = this.currentDeck.id
    } else if (this.decks.length > 0) {
      // If no last selected and no current deck, select the first deck
      this.selectedDeckId = this.decks[0].id
      this._flashService.selectDeck(this.decks[0].id)
    }
  }

  onDeckChange() {
    if (this.selectedDeckId && this.selectedDeckId !== this.currentDeck?.id) {
      this._flashService.selectDeck(this.selectedDeckId)
    }
  }

  createTag(event: any) {
    if (!this.currentFlashcard) return

    const tagName = event.target.value.trim().toLowerCase()
    if (tagName) {
      this.makingTag = false

      const currentTags = this.currentFlashcard.tags
      const tagsArray = currentTags ? currentTags.split(',').map(tag => tag.trim()) : []

      if (!tagsArray.includes(tagName)) {
        tagsArray.push(tagName)
      }

      const updatedFlashcard: Flashcard = {
        ...this.currentFlashcard,
        tags: tagsArray.join(', ')
      }

      this.currentFlashcard[5] = tagsArray.join(', ')

      const index = this.flashcards.indexOf(this.currentFlashcard)
      this._sheetsService.updateFlashcard(
        this._flashService.spreadsheetId!,
        this.currentDeck!.name,
        index,
        updatedFlashcard
      ).subscribe()
    }
  }

  showTagInput() {
    this.makingTag = true
    setTimeout(() => this.tagInputElement.nativeElement.focus(), 0)
  }

  submitAnswer() {
    this._flashService.submitAnswer()
  }
}