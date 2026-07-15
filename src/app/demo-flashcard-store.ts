import { Injectable } from '@angular/core'

import type { Deck, Flashcard } from './google-sheets.service'

interface DemoDeck extends Deck {
  flashcards: Flashcard[]
}

interface DemoState {
  decks: DemoDeck[]
}

const STORAGE_KEY = 'flashcards_public_demo_v1'

const SAMPLE_STATE: DemoState = {
  decks: [
    {
      id: 1,
      name: 'System Design',
      flashcards: [
        {
          front: 'What makes an operation idempotent?',
          back: 'Repeating it produces the same observable result.',
          correctCount: 4,
          incorrectCount: 1,
          lastCorrectDate: '2026-07-10T12:00:00.000Z',
          tags: 'reliability, APIs'
        },
        {
          front: 'What problem does backpressure solve?',
          back: 'It keeps producers from overwhelming slower consumers.',
          correctCount: 2,
          incorrectCount: 2,
          lastCorrectDate: '2026-07-08T12:00:00.000Z',
          tags: 'queues, distributed-systems'
        },
        {
          front: 'Why attach an idempotency key to a request?',
          back: 'To recognize retries and prevent duplicate side effects.',
          correctCount: 1,
          incorrectCount: 3,
          lastCorrectDate: null,
          tags: 'APIs, recovery'
        },
        {
          front: 'What belongs in a durable job record?',
          back: 'State, owner, attempts, timestamps, input reference, and result or blocker.',
          correctCount: 0,
          incorrectCount: 1,
          lastCorrectDate: null,
          tags: 'workflows, observability'
        }
      ]
    },
    {
      id: 2,
      name: 'Agent Foundations',
      flashcards: [
        {
          front: 'When should an agent hand work to a human?',
          back: 'When the action is consequential, ambiguous, destructive, or outside policy.',
          correctCount: 3,
          incorrectCount: 1,
          lastCorrectDate: '2026-07-09T12:00:00.000Z',
          tags: 'safety, human-in-the-loop'
        },
        {
          front: 'Why treat email and chat content as untrusted input?',
          back: 'They may contain malicious or irrelevant instructions that should not control the worker.',
          correctCount: 2,
          incorrectCount: 0,
          lastCorrectDate: '2026-07-11T12:00:00.000Z',
          tags: 'security, prompt-injection'
        },
        {
          front: 'What should resume after a worker crash?',
          back: 'The durable job and its existing owner, not a duplicate worker.',
          correctCount: 1,
          incorrectCount: 2,
          lastCorrectDate: null,
          tags: 'recovery, ownership'
        }
      ]
    }
  ]
}

function copyState(state: DemoState): DemoState {
  return JSON.parse(JSON.stringify(state)) as DemoState
}

@Injectable({ providedIn: 'root' })
export class DemoFlashcardStore {
  private state = this.load()

  getDecks(): Deck[] {
    return this.state.decks.map(({ id, name }) => ({ id, name }))
  }

  getFlashcards(deckName: string): Flashcard[] {
    return copyState({ decks: [{ id: 0, name: deckName, flashcards: this.findDeck(deckName).flashcards }] })
      .decks[0].flashcards
  }

  updateFlashcard(deckName: string, index: number, flashcard: Flashcard): void {
    this.findDeck(deckName).flashcards[index] = { ...flashcard }
    this.save()
  }

  deleteFlashcard(deckName: string, index: number): void {
    this.findDeck(deckName).flashcards.splice(index, 1)
    this.save()
  }

  createDeck(name: string): Deck {
    const id = Math.max(0, ...this.state.decks.map(deck => deck.id)) + 1
    this.state.decks.push({ id, name, flashcards: [] })
    this.save()
    return { id, name }
  }

  renameDeck(deckId: number, newName: string): void {
    const deck = this.state.decks.find(item => item.id === deckId)
    if (!deck) throw new Error(`Demo deck ${deckId} not found`)
    deck.name = newName
    this.save()
  }

  createFlashcard(deckName: string, flashcard: Flashcard): void {
    this.findDeck(deckName).flashcards.push({ ...flashcard })
    this.save()
  }

  reset(): void {
    this.state = copyState(SAMPLE_STATE)
    this.save()
  }

  private findDeck(deckName: string): DemoDeck {
    const deck = this.state.decks.find(item => item.name === deckName)
    if (!deck) throw new Error(`Demo deck "${deckName}" not found`)
    return deck
  }

  private load(): DemoState {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return copyState(SAMPLE_STATE)

    try {
      return JSON.parse(saved) as DemoState
    } catch {
      return copyState(SAMPLE_STATE)
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
  }
}
