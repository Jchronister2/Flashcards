import { of } from 'rxjs'

import { convertToParamMap } from '@angular/router'

import { Flashcard } from '../google-sheets.service'
import { StudyComponent } from './study.component'

describe('StudyComponent', () => {
  const card: Flashcard = {
    front: 'hello',
    back: 'hola',
    correctCount: 1,
    incorrectCount: 0,
    lastCorrectDate: null,
    tags: 'greeting'
  }

  let component: StudyComponent
  let flashService: any

  beforeEach(() => {
    localStorage.clear()
    flashService = {
      decks: [{ id: 1, name: 'Spanish' }],
      currentDeck: { id: 1, name: 'Spanish' },
      currentFlashcard: card,
      answer: '',
      feedback: '',
      flashcards: [card],
      studyCards: [card],
      isAnsweredCorrectly: false,
      isForceCorrectAnswer: false,
      initialize: jasmine.createSpy('initialize'),
      setStudyMode: jasmine.createSpy('setStudyMode'),
      selectDeck: jasmine.createSpy('selectDeck'),
      submitAnswer: jasmine.createSpy('submitAnswer'),
      gradeCurrentCard: jasmine.createSpy('gradeCurrentCard'),
      showNextFlashcard: jasmine.createSpy('showNextFlashcard'),
      updateFlashcard: jasmine.createSpy('updateFlashcard').and.returnValue(of(undefined))
    }
    const route = { queryParamMap: of(convertToParamMap({ mode: 'review' })) }
    component = new StudyComponent(flashService, route as any)
  })

  afterEach(() => component.ngOnDestroy())

  it('activates the requested study mode and initializes after the first render', async () => {
    component.ngOnInit()
    await Promise.resolve()

    expect(component.studyMode).toBe('review')
    expect(flashService.setStudyMode).toHaveBeenCalledOnceWith('review')
    expect(flashService.initialize).toHaveBeenCalledTimes(1)
  })

  it('gives Easy a distinct rating action', () => {
    component.markEasy()

    expect(flashService.gradeCurrentCard).toHaveBeenCalledOnceWith('easy')
    expect(component.actionMessage).toContain('lowered in priority')
  })

  it('stores and removes a bookmark', () => {
    component.toggleBookmark()
    expect(component.isBookmarked).toBeTrue()

    component.toggleBookmark()
    expect(component.isBookmarked).toBeFalse()
  })
})
