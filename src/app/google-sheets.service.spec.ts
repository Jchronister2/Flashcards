import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { Flashcard, GoogleSheetsService } from './google-sheets.service'

describe('GoogleSheetsService preview data', () => {
  let service: GoogleSheetsService

  beforeEach(() => {
    localStorage.setItem('google_token', 'dev-preview-token')
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(GoogleSheetsService)
  })

  afterEach(() => localStorage.clear())

  it('creates and renames a deck', () => {
    let createdId = 0
    service.createDeck('preview-spreadsheet', 'Spanish').subscribe(deck => createdId = deck.id)
    service.renameDeck('preview-spreadsheet', createdId, 'Español').subscribe()

    service.getDecks('preview-spreadsheet').subscribe(decks => {
      expect(decks.some(deck => deck.id === createdId && deck.name === 'Español')).toBeTrue()
    })
  })

  it('persists card create, update, and delete operations', () => {
    const card: Flashcard = {
      front: 'hello',
      back: 'hola',
      correctCount: 0,
      incorrectCount: 0,
      lastCorrectDate: null,
      tags: 'greeting'
    }

    service.createFlashcard('preview-spreadsheet', 'Vocabulary', card).subscribe()
    service.getFlashcards('preview-spreadsheet', 'Vocabulary').subscribe(cards => {
      const index = cards.findIndex(item => item.front === 'hello')
      expect(index).toBeGreaterThanOrEqual(0)

      const updated = { ...card, back: 'buenas' }
      service.updateFlashcard('preview-spreadsheet', 'Vocabulary', index, updated).subscribe()
      service.getFlashcards('preview-spreadsheet', 'Vocabulary').subscribe(updatedCards => {
        expect(updatedCards[index].back).toBe('buenas')
      })

      service.deleteFlashcard('preview-spreadsheet', 'Vocabulary', index).subscribe()
      service.getFlashcards('preview-spreadsheet', 'Vocabulary').subscribe(remainingCards => {
        expect(remainingCards.some(item => item.front === 'hello')).toBeFalse()
      })
    })
  })
})
