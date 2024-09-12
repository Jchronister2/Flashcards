import { FlashService } from 'src/app/flash.service'
import { GoogleSheetsService } from 'src/app/google-sheets.service'

import { Component, ElementRef, ViewChild } from '@angular/core'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css']
})
export class StudyComponent {
  @ViewChild('tagInput') tagInputElement!: ElementRef

  public makingTag = false

  get answer() { return this._flashService.answer }
  set answer(value: string) { this._flashService.answer = value }
  get currentFlashcard() { return this._flashService.currentFlashcard }
  get feedback() { return this._flashService.feedback }
  get flashcards() { return this._flashService.flashcards }
  get isAnsweredCorrectly() { return this._flashService.isAnsweredCorrectly }
  get isForceCorrectAnswer() { return this._flashService.isForceCorrectAnswer }
  get tags(): string[] {
    const currentTags = this.currentFlashcard?.[5] || ''
    return currentTags ? currentTags.split(',').map(tag => tag.trim()) : []
  }

  constructor(private _flashService: FlashService, private _sheetsService: GoogleSheetsService) {
    this._flashService.loadFlashcards()
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

      const spreadsheetId = '1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE'
      const range = `Words!F${this.flashcards.indexOf(this.currentFlashcard) + 2}`

      this._sheetsService.updateFlashcard(spreadsheetId, range, [this.currentFlashcard[5]]).subscribe()
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