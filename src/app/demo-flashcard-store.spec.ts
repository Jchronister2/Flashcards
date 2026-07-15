import { DemoFlashcardStore } from './demo-flashcard-store'

describe('DemoFlashcardStore', () => {
  let store: DemoFlashcardStore

  beforeEach(() => {
    localStorage.clear()
    store = new DemoFlashcardStore()
  })

  it('starts with public sample decks and cards', () => {
    const decks = store.getDecks()

    expect(decks.length).toBeGreaterThanOrEqual(2)
    expect(store.getFlashcards(decks[0].name).length).toBeGreaterThanOrEqual(3)
  })

  it('persists score updates without calling an external service', () => {
    const deck = store.getDecks()[0]
    const card = { ...store.getFlashcards(deck.name)[0], correctCount: 7 }

    store.updateFlashcard(deck.name, 0, card)

    const reloaded = new DemoFlashcardStore()
    expect(reloaded.getFlashcards(deck.name)[0].correctCount).toBe(7)
  })

  it('can reset visitor changes back to the sample data', () => {
    const deck = store.getDecks()[0]
    store.createFlashcard(deck.name, {
      front: 'Temporary card',
      back: 'Removed on reset',
      correctCount: 0,
      incorrectCount: 0,
      lastCorrectDate: null,
      tags: 'demo'
    })

    store.reset()

    expect(store.getFlashcards(deck.name).some(card => card.front === 'Temporary card')).toBeFalse()
  })
})
