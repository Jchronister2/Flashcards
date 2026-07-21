import { Component, EventEmitter, Input, Output } from '@angular/core'

import { Flashcard } from '../google-sheets.service'

@Component({
  selector: 'app-edit-flashcard-modal',
  templateUrl: './edit-flashcard-modal.component.html',
  styleUrls: ['./edit-flashcard-modal.component.css']
})
export class EditFlashcardModalComponent {
  @Input() flashcard: Flashcard | null = null
  @Input() isVisible = false
  @Output() save = new EventEmitter<Flashcard>()
  @Output() close = new EventEmitter<void>()

  editedFlashcard: Flashcard = {
    front: '',
    back: '',
    tags: '',
    correctCount: 0,
    incorrectCount: 0,
    lastCorrectDate: null
  }

  ngOnChanges() {
    if (this.flashcard) {
      this.editedFlashcard = { ...this.flashcard }
    }
  }

  onSave() {
    if (!this.editedFlashcard.front.trim() || !this.editedFlashcard.back.trim()) return
    this.save.emit({
      ...this.editedFlashcard,
      front: this.editedFlashcard.front.trim(),
      back: this.editedFlashcard.back.trim(),
      tags: this.editedFlashcard.tags.trim()
    })
  }

  onClose() {
    this.close.emit()
  }
}
