import { DecksComponent } from './decks.component'
import { FlashService } from '../flash.service'
import { Flashcard } from '../google-sheets.service'

describe('DecksComponent', () => {
    it('sorts the tags column by the visible tag text', () => {
        const component = new DecksComponent({} as FlashService)
        const cards = [
            { tags: 'verb' },
            { tags: 'people' },
            { tags: 'noun' },
            { tags: 'time' }
        ] as Flashcard[]

        component.sortConfig = { column: 'tags', direction: 'asc' }

        expect(component.sortFlashcards(cards).map(card => card.tags)).toEqual([
            'noun',
            'people',
            'time',
            'verb'
        ])
    })
})
