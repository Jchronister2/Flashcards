import { Observable } from 'rxjs'

import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { AppendValuesResponse, SheetsApiResponse, SheetsValueRange } from './google-sheets.types'

interface Sheet {
  properties: {
    title: string
    sheetId: number
  }
}

interface Spreadsheet {
  sheets: Sheet[]
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('google_token')
    return new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)
  }

  getFlashcards(spreadsheetId: string, range: string) {
    const headers = this.getHeaders()
    return this.http.get<SheetsApiResponse>(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      { headers }
    )
  }

  getUserSpreadsheets() {
    const headers = this.getHeaders()
    return this.http.get<{ files: { id: string, name: string }[] }>(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"',
      { headers }
    )
  }

  getSpreadsheetDetails(spreadsheetId: string) {
    const headers = this.getHeaders()
    return this.http.get<Spreadsheet>(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      { headers }
    )
  }

  createSheet(title: string) {
    const headers = this.getHeaders()
    const body = {
      properties: { title }
    }
    return this.http.post('https://sheets.googleapis.com/v4/spreadsheets', body, { headers })
  }

  updateFlashcard(spreadsheetId: string, range: string, values: any[]) {
    const headers = this.getHeaders()
    const body = {
      range: range,
      majorDimension: 'ROWS',
      values: [values]
    }

    return this.http.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      body,
      { headers }
    )
  }

  updateSheetName(spreadsheetId: string, sheetId: number, newTitle: string) {
    const headers = this.getHeaders()
    const body = {
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: sheetId,
            title: newTitle
          },
          fields: 'title'
        }
      }]
    }

    return this.http.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      body,
      { headers }
    )
  }
}