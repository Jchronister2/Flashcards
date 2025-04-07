import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'

import { FlashService } from '../flash.service'
import { GoogleSheetsService } from '../google-sheets.service'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css']
})
export class StudyComponent implements OnInit {
  @ViewChild('tagInput') tagInputElement!: ElementRef

  public makingTag = false
  public selectedDeckId: string | null = null
  public selectedSheetName: string | null = null

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
    const currentTags = this.currentFlashcard?.[5] || ''
    return currentTags ? currentTags.split(',').map(tag => tag.trim()) : []
  }

  constructor(
    private _flashService: FlashService,
    private _sheetsService: GoogleSheetsService
  ) { }

  ngOnInit() {
    // Load decks
    this._flashService.loadUserSpreadsheets()

    // Load last selected deck and sheet from localStorage
    const lastDeckId = localStorage.getItem('lastDeckId')
    const lastSheetName = localStorage.getItem('lastSheetName')

    if (lastDeckId) {
      this.selectedDeckId = lastDeckId
      // We need to wait for decks to load before selecting
      const decksLoadedInterval = setInterval(() => {
        if (this.decks.length > 0) {
          clearInterval(decksLoadedInterval)
          this.onDeckChange()

          if (lastSheetName) {
            this.selectedSheetName = lastSheetName
            this.onSheetChange()
          }
        }
      }, 100)
    }
  }

  onDeckChange() {
    if (!this.selectedDeckId) return

    this._flashService.selectDeck(this.selectedDeckId)
    localStorage.setItem('lastDeckId', this.selectedDeckId)

    // Reset sheet selection unless it's still valid
    if (!this.currentDeck?.sheets.some(s => s.name === this.selectedSheetName)) {
      this.selectedSheetName = null
      localStorage.removeItem('lastSheetName')
    }
  }

  onSheetChange() {
    if (!this.selectedSheetName) return

    this._flashService.selectSheet(this.selectedSheetName)
    localStorage.setItem('lastSheetName', this.selectedSheetName)
    this._flashService.showNextFlashcard()
  }

  createTag(event: any) {
    const tagName = event.target.value.trim().toLowerCase()

    if (tagName) {
      this.makingTag = false

      let currentTags = this.currentFlashcard[5] || ''
      let tagsArray = currentTags ? currentTags.split(',').map(tag => tag.trim()) : []

      if (!tagsArray.includes(tagName)) {
        tagsArray.push(tagName)
      }

      this.currentFlashcard[5] = tagsArray.join(', ')

      this.updateFlashcard()
    }
  }

  showTagInput() {
    this.makingTag = true

    setTimeout(() => this.tagInputElement.nativeElement.focus(), 0)
  }

  submitAnswer() {
    this._flashService.submitAnswer()
  }

  updateFlashcard() {
    if (!this._flashService.currentDeck || !this._flashService.currentSheet) return

    const range = `${this._flashService.currentSheet.name}!F${this._flashService.flashcards.indexOf(this.currentFlashcard) + 2}`
    this._sheetsService.updateFlashcard(this._flashService.currentDeck.id, range, [this.currentFlashcard[5]]).subscribe()
  }
}