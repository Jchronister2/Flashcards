import { of } from 'rxjs'

import { TestBed } from '@angular/core/testing'

import { FlashService } from './flash.service'
import { Deck, Flashcard, GoogleSheetsService } from './google-sheets.service'

describe('FlashService', () => {
  const deck: Deck = { id: 17, name: 'Japanese' }
  const cards: Flashcard[] = [
    { front: 'one', back: 'ichi', correctCount: 4, incorrectCount: 1, lastCorrectDate: null, tags: 'number' },
    { front: 'two', back: 'ni', correctCount: 0, incorrectCount: 0, lastCorrectDate: null, tags: 'number' }
  ]

  let service: FlashService
  let sheets: jasmine.SpyObj<GoogleSheetsService>

  beforeEach(() => {
    localStorage.clear()
    sheets = jasmine.createSpyObj<GoogleSheetsService>('GoogleSheetsService', [
      'getUserSpreadsheet',
      'getDecks',
      'getFlashcards',
      'getLastDeckName',
      'setLastDeckName',
      'updateFlashcard',
      'deleteFlashcard',
      'createFlashcard',
      'createDeck',
      'renameDeck'
    ])
    sheets.getUserSpreadsheet.and.returnValue(of('sheet-id'))
    sheets.getDecks.and.returnValue(of([deck]))
    sheets.getFlashcards.and.returnValue(of(cards.map(card => ({ ...card }))))
    sheets.getLastDeckName.and.returnValue(null)
    sheets.updateFlashcard.and.returnValue(of({}))
    sheets.deleteFlashcard.and.returnValue(of({}))
    sheets.createFlashcard.and.returnValue(of({}))

    TestBed.configureTestingModule({
      providers: [
        FlashService,
        { provide: GoogleSheetsService, useValue: sheets }
      ]
    })
    service = TestBed.inject(FlashService)
    service.initialize()
  })

  it('selects the first deck on first load', () => {
    expect(service.currentDeck).toEqual(deck)
    expect(service.flashcards.length).toBe(2)
    expect(service.currentFlashcard).toBeTruthy()
  })

  it('handles a one-card deck without retrying forever', () => {
    sheets.getFlashcards.and.returnValue(of([{ ...cards[0] }]))
    service.selectDeck(deck.id)

    service.showNextFlashcard()

    expect(service.currentFlashcard?.front).toBe('one')
  })

  it('updates the original row even when callers hold a card reference', () => {
    const secondCard = service.flashcards[1]
    const updated = { ...secondCard, back: 'two-updated' }

    service.updateFlashcard(secondCard, updated).subscribe()

    expect(sheets.updateFlashcard).toHaveBeenCalledWith('sheet-id', 'Japanese', 1, updated)
    expect(service.flashcards[1].back).toBe('two-updated')
  })

  it('keeps created and deleted cards in local state', () => {
    service.createFlashcard('three', 'san', 'number').subscribe()
    const createdCard = service.flashcards.find(card => card.front === 'three')!

    expect(createdCard).toBeTruthy()

    service.deleteFlashcard(createdCard).subscribe()

    expect(service.flashcards.some(card => card.front === 'three')).toBeFalse()
  })

  it('makes Learn mode prioritize least-practiced cards', () => {
    service.setStudyMode('learn')

    expect(service.studyCards[0].front).toBe('two')
  })
})
