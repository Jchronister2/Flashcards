import { BehaviorSubject, Observable, of } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'

import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'

export interface Deck {
  id: number
  name: string
}

export interface Flashcard {
  front: string
  back: string
  correctCount: number
  incorrectCount: number
  lastCorrectDate: string | null
  tags: string
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private readonly APP_NAME = 'Flashcards'
  private readonly SPREADSHEET_ID_KEY = 'flashcards_spreadsheet_id'
  private readonly LAST_DECK_KEY = 'flashcards_last_deck'
  private readonly API_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
  private _previewDecks: Deck[] = [
    { id: 1, name: 'Japanese' },
    { id: 2, name: 'Hiragana' },
    { id: 3, name: 'Vocabulary' }
  ]
  private _previewCards: Record<string, Flashcard[]> = {
    Japanese: [
      { front: '行く', back: 'to go', correctCount: 7, incorrectCount: 3, lastCorrectDate: null, tags: 'verb' },
      { front: '食べる', back: 'to eat', correctCount: 11, incorrectCount: 1, lastCorrectDate: new Date().toISOString(), tags: 'verb' },
      { front: '見る', back: 'to see', correctCount: 4, incorrectCount: 2, lastCorrectDate: null, tags: 'verb' },
      { front: '来る', back: 'to come', correctCount: 6, incorrectCount: 3, lastCorrectDate: null, tags: 'verb' },
      { front: 'する', back: 'to do', correctCount: 9, incorrectCount: 2, lastCorrectDate: new Date().toISOString(), tags: 'verb' }
    ],
    Hiragana: [
      { front: 'あ', back: 'a', correctCount: 12, incorrectCount: 1, lastCorrectDate: new Date().toISOString(), tags: 'vowel' },
      { front: 'い', back: 'i', correctCount: 10, incorrectCount: 2, lastCorrectDate: null, tags: 'vowel' },
      { front: 'う', back: 'u', correctCount: 8, incorrectCount: 2, lastCorrectDate: null, tags: 'vowel' },
      { front: 'え', back: 'e', correctCount: 6, incorrectCount: 3, lastCorrectDate: null, tags: 'vowel' },
      { front: 'お', back: 'o', correctCount: 7, incorrectCount: 1, lastCorrectDate: null, tags: 'vowel' }
    ],
    Vocabulary: [
      { front: 'turn', back: 'mawaru', correctCount: 8, incorrectCount: 2, lastCorrectDate: new Date().toISOString(), tags: 'verb' },
      { front: 'rest', back: 'yasumu', correctCount: 2, incorrectCount: 3, lastCorrectDate: null, tags: 'verb' },
      { front: 'book', back: 'hon', correctCount: 5, incorrectCount: 1, lastCorrectDate: null, tags: 'noun' },
      { front: 'water', back: 'mizu', correctCount: 3, incorrectCount: 2, lastCorrectDate: null, tags: 'noun' },
      { front: 'tomorrow', back: 'ashita', correctCount: 0, incorrectCount: 0, lastCorrectDate: null, tags: 'time' },
      { front: 'friend', back: 'tomodachi', correctCount: 1, incorrectCount: 1, lastCorrectDate: null, tags: 'people' }
    ]
  }

  constructor(private _http: HttpClient) {
    console.log('GoogleSheetsService initialized')
  }

  private getHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('google_token')
    return new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)
  }

  getUserSpreadsheet(): Observable<string> {
    if (this.isPreviewMode()) return of('preview-spreadsheet')

    console.log('Getting user spreadsheet...')
    const storedId = localStorage.getItem(this.SPREADSHEET_ID_KEY)
    if (storedId) {
      console.log('Found stored spreadsheet ID:', storedId)
      return this.verifySpreadsheetAccess(storedId).pipe(
        tap(hasAccess => console.log('Spreadsheet access verified:', hasAccess)),
        switchMap(hasAccess => {
          if (hasAccess) {
            console.log('Using existing spreadsheet')
            return of(storedId)
          } else {
            console.log('No access to stored spreadsheet, searching for existing...')
            return this.findUserSpreadsheet().pipe(
              tap(spreadsheetId => console.log('Search result:', spreadsheetId ? 'Found' : 'Not found')),
              switchMap(spreadsheetId => {
                if (spreadsheetId) {
                  console.log('Using found spreadsheet')
                  localStorage.setItem(this.SPREADSHEET_ID_KEY, spreadsheetId)
                  return of(spreadsheetId)
                }
                console.log('No existing spreadsheet found, creating new one')
                return this.createSpreadsheet()
              })
            )
          }
        })
      )
    }

    console.log('No stored spreadsheet ID, searching for existing...')
    return this.findUserSpreadsheet().pipe(
      tap(spreadsheetId => console.log('Search result:', spreadsheetId ? 'Found' : 'Not found')),
      switchMap(spreadsheetId => {
        if (spreadsheetId) {
          console.log('Using found spreadsheet')
          localStorage.setItem(this.SPREADSHEET_ID_KEY, spreadsheetId)
          return of(spreadsheetId)
        }
        console.log('Creating new spreadsheet')
        return this.createSpreadsheet()
      })
    )
  }

  private verifySpreadsheetAccess(spreadsheetId: string): Observable<boolean> {
    console.log('Verifying access to spreadsheet:', spreadsheetId)
    return this._http.get(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}`, {
      params: {
        fields: 'trashed'
      },
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => {
        const isTrashed = response.trashed
        console.log('Spreadsheet trashed status:', isTrashed)
        return !isTrashed
      }),
      catchError(() => {
        console.log('Access verification failed')
        return of(false)
      })
    )
  }

  private findUserSpreadsheet(): Observable<string | null> {
    console.log('Searching for existing spreadsheet...')
    return this._http.get('https://www.googleapis.com/drive/v3/files', {
      params: {
        q: `name='${this.APP_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id,name)'
      },
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => {
        const files = response.files
        console.log('Found spreadsheets:', files)
        return files.length > 0 ? files[0].id : null
      }),
      catchError(error => {
        console.error('Error searching for spreadsheet:', error)
        return of(null)
      })
    )
  }

  private createSpreadsheet(): Observable<string> {
    console.log('Creating new spreadsheet...')
    return this._http.post('https://sheets.googleapis.com/v4/spreadsheets', {
      properties: {
        title: this.APP_NAME
      }
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Spreadsheet created:', response)),
      switchMap((response: any) => {
        const spreadsheetId = response.spreadsheetId
        const firstSheetName = response.sheets?.[0]?.properties?.title || 'Sheet1'
        localStorage.setItem(this.SPREADSHEET_ID_KEY, spreadsheetId)
        return this.writeDeckHeaders(spreadsheetId, firstSheetName).pipe(
          map(() => spreadsheetId)
        )
      })
    )
  }

  getDecks(spreadsheetId: string): Observable<Deck[]> {
    if (this.isPreviewMode()) {
      return of(this._previewDecks.map(deck => ({ ...deck })))
    }

    console.log('Getting decks for spreadsheet:', spreadsheetId)
    return this._http.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Spreadsheet details:', response)),
      map((response: any) => {
        const decks = response.sheets.map((sheet: any) => ({
          id: sheet.properties.sheetId,
          name: sheet.properties.title
        }))
        console.log('Found decks:', decks)
        return decks
      })
    )
  }

  getFlashcards(spreadsheetId: string, deckName: string): Observable<Flashcard[]> {
    if (this.isPreviewMode()) {
      return of((this._previewCards[deckName] || []).map(card => ({ ...card })))
    }

    console.log('Getting flashcards for deck:', deckName)
    return this._http.get(this.valuesUrl(spreadsheetId, deckName, 'A2:F'), {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Raw flashcard data:', response)),
      map((response: any) => {
        const values = response.values || []
        const flashcards = values.map((row: string[]) => ({
          front: row[0] || '',
          back: row[1] || '',
          correctCount: parseInt(row[2]) || 0,
          incorrectCount: parseInt(row[3]) || 0,
          lastCorrectDate: row[4] || null,
          tags: row[5] || ''
        }))
        console.log('Processed flashcards:', flashcards)
        return flashcards
      })
    )
  }

  updateFlashcard(spreadsheetId: string, deckName: string, index: number, flashcard: Flashcard): Observable<any> {
    if (this.isPreviewMode()) {
      const cards = this._previewCards[deckName] || []
      if (index >= 0 && index < cards.length) cards[index] = { ...flashcard }
      return of({})
    }

    console.log('Updating flashcard:', { deckName, index, flashcard })
    const range = `A${index + 2}:F${index + 2}`
    const values = [[
      flashcard.front,
      flashcard.back,
      flashcard.correctCount,
      flashcard.incorrectCount,
      flashcard.lastCorrectDate,
      flashcard.tags
    ]]

    return this._http.put(this.valuesUrl(spreadsheetId, deckName, range), {
      values,
      majorDimension: 'ROWS'
    }, {
      params: {
        valueInputOption: 'USER_ENTERED'
      },
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Update response:', response))
    )
  }

  deleteFlashcard(spreadsheetId: string, deckName: string, index: number): Observable<any> {
    if (this.isPreviewMode()) {
      const cards = this._previewCards[deckName] || []
      if (index >= 0 && index < cards.length) cards.splice(index, 1)
      return of({})
    }

    console.log('Deleting flashcard:', { deckName, index })
    return this._http.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: this.getHeaders()
    }).pipe(
      switchMap(response => {
        const sheet = (response as any).sheets.find((s: any) => s.properties.title === deckName)
        if (!sheet) {
          throw new Error(`Sheet ${deckName} not found`)
        }
        const sheetId = sheet.properties.sheetId
        return this._http.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: index + 1, // +1 because the first row is headers
                endIndex: index + 2
              }
            }
          }]
        }, {
          headers: this.getHeaders()
        })
      }),
      tap(response => console.log('Delete response:', response))
    )
  }

  createDeck(spreadsheetId: string, name: string): Observable<Deck> {
    if (this.isPreviewMode()) {
      const id = Math.max(0, ...this._previewDecks.map(deck => deck.id)) + 1
      const deck = { id, name }
      this._previewDecks.push(deck)
      this._previewCards[name] = []
      return of({ ...deck })
    }

    console.log('Creating new deck:', name)
    return this._http.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      requests: [{
        addSheet: {
          properties: {
            title: name
          }
        }
      }]
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Create deck response:', response)),
      switchMap((response: any) => {
        const sheetId = response.replies[0].addSheet.properties.sheetId
        const deck = {
          id: sheetId,
          name
        }
        return this.writeDeckHeaders(spreadsheetId, name).pipe(
          map(() => deck)
        )
      })
    )
  }

  renameDeck(spreadsheetId: string, deckId: number, newName: string): Observable<any> {
    if (this.isPreviewMode()) {
      const deck = this._previewDecks.find(item => item.id === deckId)
      if (deck) {
        const oldName = deck.name
        deck.name = newName
        this._previewCards[newName] = this._previewCards[oldName] || []
        delete this._previewCards[oldName]
      }
      return of({})
    }

    console.log('Renaming deck:', { deckId, newName })
    return this._http.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: deckId,
            title: newName
          },
          fields: 'title'
        }
      }]
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Rename response:', response))
    )
  }

  createFlashcard(spreadsheetId: string, sheetName: string, flashcard: Flashcard): Observable<any> {
    if (this.isPreviewMode()) {
      const cards = this._previewCards[sheetName] || (this._previewCards[sheetName] = [])
      cards.push({ ...flashcard })
      return of({})
    }

    console.log('Creating flashcard:', { sheetName, flashcard })
    const values = [[
      flashcard.front,
      flashcard.back,
      flashcard.correctCount,
      flashcard.incorrectCount,
      flashcard.lastCorrectDate,
      flashcard.tags
    ]]

    return this._http.post(`${this.valuesUrl(spreadsheetId, sheetName, 'A:F')}:append`, {
      values,
      majorDimension: 'ROWS'
    }, {
      params: {
        valueInputOption: 'USER_ENTERED'
      },
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Create flashcard response:', response))
    )
  }

  getLastDeckName(): string | null {
    return localStorage.getItem(this.LAST_DECK_KEY)
  }

  setLastDeckName(name: string): void {
    localStorage.setItem(this.LAST_DECK_KEY, name)
  }

  private valuesUrl(spreadsheetId: string, sheetName: string, range: string): string {
    const escapedName = sheetName.replace(/'/g, "''")
    const a1Range = `'${escapedName}'!${range}`
    return `${this.API_URL}/${spreadsheetId}/values/${encodeURIComponent(a1Range)}`
  }

  private writeDeckHeaders(spreadsheetId: string, sheetName: string): Observable<any> {
    return this._http.put(this.valuesUrl(spreadsheetId, sheetName, 'A1:F1'), {
      values: [['Front', 'Back', 'Correct', 'Incorrect', 'Last Correct', 'Tags']],
      majorDimension: 'ROWS'
    }, {
      params: { valueInputOption: 'RAW' },
      headers: this.getHeaders()
    })
  }

  private isPreviewMode(): boolean {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
      && localStorage.getItem('google_token') === 'dev-preview-token'
  }
}
