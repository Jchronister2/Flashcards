import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GoogleSheetsService } from './google-sheets.service';
import { RuntimeConfigService } from './runtime-config.service';

class DemoRuntimeConfig {
  readonly isDemoMode = true
}

class AuthenticatedRuntimeConfig {
  readonly isDemoMode = false
}

describe('GoogleSheetsService', () => {
  let service: GoogleSheetsService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: RuntimeConfigService, useClass: DemoRuntimeConfig }]
    });
    service = TestBed.inject(GoogleSheetsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('serves sample data in demo mode without Google API requests', () => {
    let spreadsheetId = ''
    let deckCount = 0

    service.getUserSpreadsheet().subscribe(value => spreadsheetId = value)
    service.getDecks('demo-spreadsheet').subscribe(decks => deckCount = decks.length)

    expect(spreadsheetId).toBe('demo-spreadsheet')
    expect(deckCount).toBeGreaterThanOrEqual(2)
    http.expectNone(() => true)
  })

  it('uses Google sheet IDs consistently for listing and renaming decks', () => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: RuntimeConfigService, useClass: AuthenticatedRuntimeConfig }]
    })
    service = TestBed.inject(GoogleSheetsService)
    http = TestBed.inject(HttpTestingController)

    let deckId = 0
    service.getDecks('sheet-1').subscribe(decks => deckId = decks[0].id)
    http.expectOne('https://sheets.googleapis.com/v4/spreadsheets/sheet-1').flush({
      sheets: [{ properties: { sheetId: 42, title: 'Backend Systems' } }]
    })

    expect(deckId).toBe(42)

    service.renameDeck('sheet-1', deckId, 'Platform Systems').subscribe()
    const request = http.expectOne('https://sheets.googleapis.com/v4/spreadsheets/sheet-1:batchUpdate')
    expect(request.request.body.requests[0].updateSheetProperties.properties.sheetId).toBe(42)
    request.flush({})
  })
});
