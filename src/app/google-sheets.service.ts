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

  addFlashcard(spreadsheetId: string, range: string, values: any[]) {
    const accessToken = localStorage.getItem('google_token')
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`)
    const body: SheetsValueRange = {
      range,
      majorDimension: 'ROWS',
      values: [values],
    }

    return this.http.post<AppendValuesResponse>(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, body, { headers })
  }
}