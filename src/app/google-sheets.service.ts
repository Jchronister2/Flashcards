import { Injectable } from '@angular/core'

declare var gapi: any

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  constructor() { }

  getSheetData(spreadsheetId: string, range: string): Promise<any> {
    return gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range, })
  }
}