import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { AppendValuesResponse, SheetsApiResponse, SheetsValueRange } from './google-sheets.types'

@Injectable({
  providedIn: 'root',
})
export class GoogleSheetsService {
  constructor(private http: HttpClient) { }

  getFlashcards(spreadsheetId: string, range: string) {
    const accessToken = localStorage.getItem('google_token')
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)

    return this.http.get<SheetsApiResponse>(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, { headers })
  }

  updateFlashcard(spreadsheetId: string, range: string, values: any[]) {
    const accessToken = localStorage.getItem('google_token')
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)
    const body = {
      range: range,
      majorDimension: 'ROWS',
      values: [values],
    }

    return this.http.put(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, body, { headers })
  }
}