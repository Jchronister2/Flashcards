import { Component, OnInit } from '@angular/core'

import { FlashService } from '../flash.service'
import { Flashcard, GoogleSheetsService } from '../google-sheets.service'

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
    searchQuery: string = ''
    showCreateModal = false
    showEditModal = false
    newCard = {
        front: '',
        back: '',
        tags: ''
    }
    editCard: Flashcard | null = null
    currentFlashcard: Flashcard | null = null
    private readonly SEARCH_THRESHOLD = 0.7 // 70% similarity threshold

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
        if (this.searchQuery) {
            cards = cards.filter(card => this.matchesSearch(card))
        }
        return this.sortFlashcards(cards)
    }

    constructor(
        private _flashService: FlashService,
        private _sheetsService: GoogleSheetsService
    ) { }

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

    clearFilters() {
        this.activeTagFilter = null
        this.searchQuery = ''
    }

    onSearch() {
        // The getter will automatically update when searchQuery changes
    }

    private matchesSearch(card: Flashcard): boolean {
        if (!this.searchQuery) return true

        const searchLower = this.searchQuery.toLowerCase()
        const frontLower = card.front.toLowerCase()
        const backLower = card.back.toLowerCase()
        const tags = this.getTags(card.tags).map(tag => tag.toLowerCase())

        // Check direct matches first
        if (frontLower.includes(searchLower) ||
            backLower.includes(searchLower) ||
            tags.some(tag => tag.includes(searchLower))) {
            return true
        }

        // If no direct match, check fuzzy matches
        return this.getSimilarity(frontLower, searchLower) >= this.SEARCH_THRESHOLD ||
            this.getSimilarity(backLower, searchLower) >= this.SEARCH_THRESHOLD ||
            tags.some(tag => this.getSimilarity(tag, searchLower) >= this.SEARCH_THRESHOLD)
    }

    private getSimilarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2
        const shorter = s1.length > s2.length ? s2 : s1
        const longerLength = longer.length

        if (longerLength === 0) return 1.0

        return (longerLength - this.getEditDistance(longer, shorter)) / longerLength
    }

    private getEditDistance(s1: string, s2: string): number {
        s1 = s1.toLowerCase()
        s2 = s2.toLowerCase()

        const costs = new Array<number>()
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1]
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                        }
                        costs[j - 1] = lastValue
                        lastValue = newValue
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue
        }
        return costs[s2.length]
    }

    showCreateCardModal() {
        this.showCreateModal = true
        this.newCard = {
            front: '',
            back: '',
            tags: ''
        }
    }

    hideCreateCardModal() {
        this.showCreateModal = false
    }

    createCard() {
        if (!this.newCard.front || !this.newCard.back) return

        this._flashService.createFlashcard(
            this.newCard.front,
            this.newCard.back,
            this.newCard.tags
        )
        this.hideCreateCardModal()
    }

    editFlashcard(card: Flashcard) {
        this.currentFlashcard = card
        this.editCard = { ...card }
        this.showEditModal = true
    }

    saveEdit(updatedFlashcard: Flashcard) {
        if (!this.currentFlashcard) return

        const index = this.flashcards.indexOf(this.currentFlashcard)
        this._sheetsService.updateFlashcard(
            this._flashService.spreadsheetId!,
            this.currentDeck!.name,
            index,
            updatedFlashcard
        ).subscribe(() => {
            this._flashService.selectDeck(this.currentDeck!.id)
            this.hideEditModal()
        })
    }

    hideEditModal() {
        this.showEditModal = false
        this.editCard = null
        this.currentFlashcard = null
    }
} 