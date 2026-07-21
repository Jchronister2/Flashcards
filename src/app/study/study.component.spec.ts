import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { of } from 'rxjs'

import { FlashService } from '../flash.service'
import { GoogleSheetsService } from '../google-sheets.service'
import { StudyComponent } from './study.component'

class FlashServiceStub {
  readonly decks = [
    { id: 1, name: 'System Design' },
    { id: 2, name: 'Agent Foundations' }
  ]
  currentDeck = this.decks[0]
  currentFlashcard = {
    front: 'What is idempotency?',
    back: 'Repeating an operation has the same observable result.',
    correctCount: 2,
    incorrectCount: 1,
    lastCorrectDate: null,
    tags: 'reliability, APIs'
  }
  flashcards = [this.currentFlashcard]
  spreadsheetId = 'demo-spreadsheet'
  answer = ''
  feedback = ''
  isAnsweredCorrectly = false
  isForceCorrectAnswer = false
  initialize = jasmine.createSpy('initialize')
  selectDeck = jasmine.createSpy('selectDeck')
  submitAnswer = jasmine.createSpy('submitAnswer')
  rateCurrentCard = jasmine.createSpy('rateCurrentCard')
  showNextFlashcard = jasmine.createSpy('showNextFlashcard')
}

class SheetsServiceStub {
  updateFlashcard = jasmine.createSpy('updateFlashcard').and.returnValue(of(null))
}

describe('StudyComponent', () => {
  let component: StudyComponent
  let fixture: ComponentFixture<StudyComponent>
  let flashService: FlashServiceStub

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({
      declarations: [StudyComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: FlashService, useClass: FlashServiceStub },
        { provide: GoogleSheetsService, useClass: SheetsServiceStub }
      ]
    })
    fixture = TestBed.createComponent(StudyComponent)
    component = fixture.componentInstance
    flashService = TestBed.inject(FlashService) as unknown as FlashServiceStub
    fixture.detectChanges()
  })

  it('initializes the study data', async () => {
    await fixture.whenStable()

    expect(component).toBeTruthy()
    expect(flashService.initialize).toHaveBeenCalled()
  })

  it('selects a deck from the toolbar without reselecting the current deck', () => {
    component.onDeckChange('2')
    component.onDeckChange('1')

    expect(flashService.selectDeck).toHaveBeenCalledOnceWith(2)
  })

  it('records Again and Good ratings without requiring typed-answer mode', () => {
    component.markAgain()
    component.markGood()

    expect(flashService.rateCurrentCard).toHaveBeenCalledWith(false)
    expect(flashService.rateCurrentCard).toHaveBeenCalledWith(true)
  })

  it('persists bookmarks for the current deck and card', () => {
    component.toggleBookmark()
    expect(component.isBookmarked).toBeTrue()

    component.toggleBookmark()
    expect(component.isBookmarked).toBeFalse()
  })
})
