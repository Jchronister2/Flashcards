import { Component, OnInit } from '@angular/core'

import { FlashService } from '../flash.service'
import { Flashcard } from '../google-sheets.service'

interface SortConfig {
    column: string
    direction: 'asc' | 'desc'
}

@Component({
    selector: 'app-decks',
    templateUrl: './decks.component.html',
    styleUrls: ['./decks.component.css']
})
export class DecksComponent implements OnInit {
    sortConfig: SortConfig = { column: '', direction: 'asc' }
    isEditingDeckName = false
    newDeckName = ''
    activeTagFilter: string | null = null

    get decks() {
        return this._flashService.decks
    }

    get currentDeck() {
        return this._flashService.currentDeck
    }

    get flashcards() {
        let cards = this._flashService.flashcards
        if (this.activeTagFilter) {
            cards = cards.filter(card => this.getTags(card.tags).includes(this.activeTagFilter!))
        }
        return this.sortFlashcards(cards)
    }

    constructor(private _flashService: FlashService) { }

    ngOnInit() {
        this._flashService.initialize()
    }

    onDeckSelect(deckId: number) {
        this._flashService.selectDeck(deckId)
    }

    startEditingDeckName() {
        if (!this.currentDeck) return
        this.isEditingDeckName = true
        this.newDeckName = this.currentDeck.name
    }

    saveDeckName() {
        if (!this.currentDeck || !this.newDeckName.trim()) return
        this._flashService.renameDeck(this.currentDeck.id, this.newDeckName.trim())
        this.isEditingDeckName = false
        this.newDeckName = ''
    }

    cancelEditingDeckName() {
        this.isEditingDeckName = false
        this.newDeckName = ''
    }

    sortFlashcards(cards: Flashcard[]) {
        if (!this.sortConfig.column) return cards

        return [...cards].sort((a, b) => {
            const aValue = this.getValueByColumn(a, this.sortConfig.column)
            const bValue = this.getValueByColumn(b, this.sortConfig.column)

            const comparison = this.compare(aValue, bValue)
            return this.sortConfig.direction === 'asc' ? comparison : -comparison
        })
    }

    toggleSort(column: string) {
        if (this.sortConfig.column === column) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc'
        } else {
            this.sortConfig.column = column
            this.sortConfig.direction = 'asc'
        }
    }

    private getValueByColumn(card: Flashcard, column: string): any {
        switch (column) {
            case 'front': return card.front
            case 'back': return card.back
            case 'correct': return card.correctCount
            case 'incorrect': return card.incorrectCount
            case 'lastCorrect': return card.lastCorrectDate ? new Date(card.lastCorrectDate) : null
            case 'tags': return this.getTagsCount(card.tags)
            default: return ''
        }
    }

    private getTagsCount(tagsString: string): number {
        return this.getTags(tagsString).length
    }

    private compare(a: any, b: any): number {
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() - b.getTime()
        }
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b
        }
        return String(a).localeCompare(String(b))
    }

    getTags(tagsString: string): string[] {
        return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }

    onTagClick(tag: string) {
        this.activeTagFilter = tag
    }

    clearTagFilter() {
        this.activeTagFilter = null
    }
} 