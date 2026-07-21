import { of } from 'rxjs'

import { DecksComponent } from './decks.component'
import type { Flashcard } from '../google-sheets.service'

describe('DecksComponent', () => {
  it('uses the source card index when a sorted view is active', () => {
    const first: Flashcard = {
      front: 'Alpha', back: 'First', correctCount: 0, incorrectCount: 0,
      lastCorrectDate: null, tags: 'one'
    }
    const second: Flashcard = {
      front: 'Zulu', back: 'Second', correctCount: 0, incorrectCount: 0,
      lastCorrectDate: null, tags: 'two'
    }
    const flashService = {
      decks: [{ id: 1, name: 'Deck' }],
      currentDeck: { id: 1, name: 'Deck' },
      spreadsheetId: 'demo-spreadsheet',
      flashcards: [first, second],
      selectDeck: jasmine.createSpy('selectDeck')
    }
    const sheetsService = {
      deleteFlashcard: jasmine.createSpy('deleteFlashcard').and.returnValue(of(null))
    }
    const component = new DecksComponent(flashService as any, sheetsService as any)
    component.sortConfig = { column: 'front', direction: 'desc' }
    component.dontAskAgain = true

    component.deleteFlashcard(first)

    expect(sheetsService.deleteFlashcard).toHaveBeenCalledWith('demo-spreadsheet', 'Deck', 0)
  })

  it('creates a named deck from the deck manager', () => {
    const flashService = {
      decks: [],
      currentDeck: null,
      flashcards: [],
      createDeck: jasmine.createSpy('createDeck')
    }
    const component = new DecksComponent(flashService as any, {} as any)
    component.newDeckName = 'Backend Systems'
    component.showCreateDeckModal = true

    component.createDeck()

    expect(flashService.createDeck).toHaveBeenCalledOnceWith('Backend Systems')
    expect(component.showCreateDeckModal).toBeFalse()
  })
})
