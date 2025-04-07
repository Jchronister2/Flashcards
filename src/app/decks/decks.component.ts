import { Component, OnInit } from '@angular/core'

import { FlashService } from '../flash.service'

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
    isEditingSheetName = false
    newSheetName = ''

    get decks() {
        return this._flashService.decks
    }

    get currentDeck() {
        return this._flashService.currentDeck
    }

    get currentSheet() {
        return this._flashService.currentSheet
    }

    get flashcards() {
        return this.sortFlashcards(this._flashService.flashcards)
    }

    constructor(private _flashService: FlashService) { }

    ngOnInit() {
        this._flashService.loadUserSpreadsheets()
    }

    onDeckSelect(deckId: string) {
        this._flashService.selectDeck(deckId)
    }

    onSheetSelect(sheetName: string) {
        this._flashService.selectSheet(sheetName)
    }

    startEditingSheetName() {
        if (!this.currentSheet) return
        this.isEditingSheetName = true
        this.newSheetName = this.currentSheet.name
    }

    saveSheetName() {
        if (!this.currentSheet || !this.newSheetName.trim()) return
        this._flashService.updateSheetName(this.currentSheet.name, this.newSheetName.trim())
        this.isEditingSheetName = false
        this.newSheetName = ''
    }

    cancelEditingSheetName() {
        this.isEditingSheetName = false
        this.newSheetName = ''
    }

    sortFlashcards(cards: any[]) {
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

    private getValueByColumn(card: any[], column: string): any {
        switch (column) {
            case 'front': return card[0]
            case 'back': return card[1]
            case 'correct': return card[2]
            case 'incorrect': return card[3]
            case 'lastCorrect': return new Date(card[4])
            default: return ''
        }
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
} 