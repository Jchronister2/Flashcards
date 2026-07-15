import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FlashService } from './flash.service';
import { GoogleSheetsService } from './google-sheets.service';
import { of } from 'rxjs';

class DemoSheetsStub {
  readonly isDemoMode = true
  getUserSpreadsheet() { return of('demo-spreadsheet') }
  getDecks() { return of([{ id: 1, name: 'Sample deck' }]) }
  getLastDeckName() { return null }
  setLastDeckName() { }
  getFlashcards() {
    return of([{
      front: 'Question',
      back: 'Answer',
      correctCount: 0,
      incorrectCount: 0,
      lastCorrectDate: null,
      tags: 'demo'
    }])
  }
  resetDemoData() { }
}

describe('FlashService', () => {
  let service: FlashService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: GoogleSheetsService, useClass: DemoSheetsStub }]
    });
    service = TestBed.inject(FlashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('selects the first available deck when no prior selection exists', () => {
    service.initialize()

    expect(service.currentDeck?.name).toBe('Sample deck')
    expect(service.currentFlashcard?.front).toBe('Question')
  })

  it('can advance a one-card deck without retrying random selection forever', () => {
    service.initialize()
    spyOn(Math, 'random').and.returnValue(0)

    service.showNextFlashcard()

    expect(service.currentFlashcard?.front).toBe('Question')
    expect(Math.random).not.toHaveBeenCalled()
  })
});
