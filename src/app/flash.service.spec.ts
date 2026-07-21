import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FlashService } from './flash.service';
import { GoogleSheetsService } from './google-sheets.service';
import { of } from 'rxjs';

class DemoSheetsStub {
  readonly isDemoMode = true
  updateFlashcard = jasmine.createSpy('updateFlashcard').and.returnValue(of(null))
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

  it('records a study rating and advances without requiring a typed answer', () => {
    const sheets = TestBed.inject(GoogleSheetsService) as unknown as DemoSheetsStub
    service.initialize()

    service.rateCurrentCard(false)

    expect(sheets.updateFlashcard).toHaveBeenCalledWith(
      'demo-spreadsheet',
      'Sample deck',
      0,
      jasmine.objectContaining({ incorrectCount: 1 })
    )
    expect(service.isForceCorrectAnswer).toBeFalse()
  })
});
