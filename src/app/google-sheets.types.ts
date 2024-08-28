export interface SheetsApiResponse {
    range: string
    majorDimension: string
    values: string[][]
}

export interface AppendValuesResponse {
    spreadsheetId: string
    tableRange: string
    updates: {
        spreadsheetId: string
        updatedRange: string
        updatedRows: number
        updatedColumns: number
        updatedCells: number
    }
}

export interface SheetsValueRange {
    range: string
    majorDimension: 'ROWS' | 'COLUMNS'
    values: any[][]
}