import { FlashService } from 'src/app/flash.service'

import { Component } from '@angular/core'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css']
})
export class StudyComponent {
  get answer() { return this._flashService.answer }
  set answer(value: string) { this._flashService.answer = value }
  get currentFlashcard() { return this._flashService.currentFlashcard }
  get feedback() { return this._flashService.feedback }
  get flashcards() { return this._flashService.flashcards }
  get isAnsweredCorrectly() { return this._flashService.isAnsweredCorrectly }
  get isForceCorrectAnswer() { return this._flashService.isForceCorrectAnswer }

  constructor(private _flashService: FlashService) {
    this._flashService.loadFlashcards()
  }

  submitAnswer() {
    this._flashService.submitAnswer()
  }
}