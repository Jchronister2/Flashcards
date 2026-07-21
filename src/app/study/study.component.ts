import { Component, HostListener, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'

import { FlashService, StudyMode } from '../flash.service'
import { Flashcard } from '../google-sheets.service'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css']
})
export class StudyComponent implements OnDestroy, OnInit {
  private readonly BOOKMARKS_KEY = 'flashcards_bookmarks'
  private readonly ACTIVITY_KEY = 'flashcards_study_activity'
  public selectedDeckId: number | null = null
  public showEditModal = false
  public showOptionsPanel = false
  public editCard: Flashcard | null = null
  public isRevealed = false
  public isFullscreen = false
  public studyMode: StudyMode = 'flashcards'
  public actionMessage = ''
  private _modeSubscription?: Subscription
  private _messageTimer?: ReturnType<typeof setTimeout>

  get decks() {
    return this._flashService.decks
  }

  get currentDeck() {
    return this._flashService.currentDeck
  }

  get currentFlashcard() {
    return this._flashService.currentFlashcard
  }

  get answer() {
    return this._flashService.answer
  }

  set answer(value: string) {
    this._flashService.answer = value
  }

  get feedback() {
    return this._flashService.feedback
  }

  get flashcards() {
    return this._flashService.flashcards
  }

  get studyCards() {
    return this._flashService.studyCards
  }

  get isAnsweredCorrectly() {
    return this._flashService.isAnsweredCorrectly
  }

  get isForceCorrectAnswer() {
    return this._flashService.isForceCorrectAnswer
  }

  get tags(): string[] {
    const currentTags = this.currentFlashcard?.tags || ''
    return currentTags ? currentTags.split(',').map(tag => tag.trim()) : []
  }

  get currentCardIndex(): number {
    if (!this.currentFlashcard) return 0
    const index = this.studyCards.indexOf(this.currentFlashcard)
    return index >= 0 ? index + 1 : 1
  }

  get masteryScore(): number {
    if (!this.flashcards.length) return 0

    const totals = this.flashcards.reduce((sum, card) => {
      return {
        correct: sum.correct + card.correctCount,
        total: sum.total + card.correctCount + card.incorrectCount
      }
    }, { correct: 0, total: 0 })

    return totals.total ? Math.round((totals.correct / totals.total) * 100) : 0
  }

  get streakDays(): number {
    const days = this.getStudyActivityDays()
    let streak = 0
    const current = new Date()

    while (days.has(this.toDateKey(current))) {
      streak++
      current.setDate(current.getDate() - 1)
    }

    return streak
  }

  get weekActivity() {
    const days = this.getStudyActivityDays()
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const today = new Date()
    const week = []

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today)
      date.setDate(today.getDate() - offset)
      const active = days.has(this.toDateKey(date))
      week.push({
        label: labels[date.getDay()],
        level: active ? 2 : 0
      })
    }

    return week
  }

  get upcomingCards(): Flashcard[] {
    if (!this.studyCards.length) return []
    return this.studyCards
      .filter(card => card !== this.currentFlashcard)
      .slice(0, 5)
  }

  get studyFocusLabel(): string {
    if (this.studyMode === 'review') return 'Review missed cards'
    if (this.studyMode === 'learn') return 'Learn least-practiced'
    return 'All cards'
  }

  get canSpeak(): boolean {
    return 'speechSynthesis' in window
  }

  get isBookmarked(): boolean {
    const key = this.currentCardKey()
    return key ? this.getBookmarks().includes(key) : false
  }

  constructor(
    private _flashService: FlashService,
    private _route: ActivatedRoute
  ) { }

  ngOnInit() {
    this._modeSubscription = this._route.queryParamMap.subscribe(params => {
      const requestedMode = params.get('mode')
      this.studyMode = requestedMode === 'review' || requestedMode === 'learn'
        ? requestedMode
        : 'flashcards'
      this.isRevealed = false
      this._flashService.setStudyMode(this.studyMode)
    })

    queueMicrotask(() => this._flashService.initialize())
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
  }

  onDeckChange(deckId: number) {
    this.selectedDeckId = deckId
    if (deckId && deckId !== this.currentDeck?.id) {
      this.isRevealed = false
      this._flashService.selectDeck(deckId)
    }
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
    this._modeSubscription?.unsubscribe()
    if (this._messageTimer) clearTimeout(this._messageTimer)
  }

  submitAnswer() {
    if (!this.answer.trim()) {
      this.showAction('Type an answer first, or rate the revealed card.')
      return
    }

    this.recordStudyActivity()
    this._flashService.submitAnswer()
    this.answer = ''
    this.isRevealed = false
  }

  revealAnswer() {
    this.isRevealed = true
    this.showAction('Answer revealed. Rate the card when you are ready.')
  }

  markAgain() {
    if (!this.currentFlashcard) return
    this.recordStudyActivity()
    this.answer = ''
    this._flashService.gradeCurrentCard('again')
    this.isRevealed = false
    this.showAction('Card marked for another review.')
  }

  markGood() {
    if (!this.currentFlashcard) return
    this.recordStudyActivity()
    this.answer = ''
    this._flashService.gradeCurrentCard('good')
    this.isRevealed = false
    this.showAction('Card marked good.')
  }

  markEasy() {
    if (!this.currentFlashcard) return
    this.recordStudyActivity()
    this.answer = ''
    this._flashService.gradeCurrentCard('easy')
    this.isRevealed = false
    this.showAction('Card marked easy and lowered in priority.')
  }

  openEditModal() {
    if (!this.currentFlashcard) return
    this.showEditModal = true
    this.editCard = { ...this.currentFlashcard }
  }

  toggleOptions() {
    this.showOptionsPanel = !this.showOptionsPanel
  }

  clearAnswer() {
    this.answer = ''
    this.showOptionsPanel = false
    this.showAction('Answer cleared.')
  }

  shuffleCard() {
    this.isRevealed = false
    this._flashService.showNextFlashcard()
    this.showOptionsPanel = false
  }

  async copyCurrentCard() {
    if (!this.currentFlashcard) return

    const text = `${this.currentFlashcard.front} - ${this.currentFlashcard.back}`
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      this.showAction('Card copied.')
    } catch {
      window.prompt('Copy this card:', text)
      this.showAction('Card ready to copy.')
    }
    this.showOptionsPanel = false
  }

  toggleBookmark() {
    const key = this.currentCardKey()
    if (!key) return

    const bookmarks = this.getBookmarks()
    const nextBookmarks = bookmarks.includes(key)
      ? bookmarks.filter(bookmark => bookmark !== key)
      : [...bookmarks, key]

    localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(nextBookmarks))
    this.showAction(nextBookmarks.includes(key) ? 'Card bookmarked.' : 'Bookmark removed.')
  }

  speakCard() {
    if (!this.currentFlashcard) return
    if (!this.canSpeak) {
      this.showAction('Read aloud is not supported by this browser.')
      return
    }

    window.speechSynthesis.cancel()
    const text = this.isRevealed
      ? `${this.currentFlashcard.front}. ${this.currentFlashcard.back}`
      : this.currentFlashcard.front
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = this.currentDeck?.name.toLowerCase().includes('japanese') ? 'ja-JP' : 'en-US'
    window.speechSynthesis.speak(utterance)
    this.showAction('Reading card aloud.')
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      const studyPage = document.querySelector('.study-page') as HTMLElement | null
      await (studyPage || document.documentElement).requestFullscreen()
    } catch {
      this.showOptionsPanel = false
      this.showAction('Fullscreen is unavailable in this browser.')
    }
  }

  @HostListener('document:click', ['$event'])
  closeOptionsOnOutsideClick(event: Event) {
    const target = event.target as Element | null
    if (this.showOptionsPanel && !target?.closest('.toolbar-actions')) {
      this.showOptionsPanel = false
    }
  }

  @HostListener('document:keydown.escape')
  closeOverlays() {
    this.showOptionsPanel = false
    if (this.showEditModal) this.hideEditModal()
  }

  private onFullscreenChange = () => {
    this.isFullscreen = !!document.fullscreenElement
  }

  private currentCardKey(): string | null {
    if (!this.currentFlashcard || !this.currentDeck) return null
    return [
      this.currentDeck.name,
      this.currentFlashcard.front,
      this.currentFlashcard.back
    ].join('::')
  }

  private getBookmarks(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.BOOKMARKS_KEY) || '[]')
    } catch {
      return []
    }
  }

  private recordStudyActivity() {
    const days = this.getStudyActivityDays()
    days.add(this.toDateKey(new Date()))
    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify([...days].sort()))
  }

  private getStudyActivityDays(): Set<string> {
    const days = new Set<string>()

    try {
      const storedDays = JSON.parse(localStorage.getItem(this.ACTIVITY_KEY) || '[]')
      if (Array.isArray(storedDays)) {
        storedDays.forEach(day => typeof day === 'string' && days.add(day))
      }
    } catch {
    }

    this.flashcards.forEach(card => {
      if (!card.lastCorrectDate) return
      const date = new Date(card.lastCorrectDate)
      if (!Number.isNaN(date.getTime())) {
        days.add(this.toDateKey(date))
      }
    })

    return days
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private showAction(message: string) {
    this.actionMessage = message
    if (this._messageTimer) clearTimeout(this._messageTimer)
    this._messageTimer = setTimeout(() => {
      this.actionMessage = ''
    }, 2400)
  }

  hideEditModal() {
    this.showEditModal = false
    this.editCard = null
  }

  saveEdit(updatedFlashcard: Flashcard) {
    if (!this.currentFlashcard) return

    this._flashService.updateFlashcard(this.currentFlashcard, updatedFlashcard).subscribe({
      next: () => {
        this.hideEditModal()
        this.showAction('Card updated.')
      },
      error: () => this.showAction('Card could not be updated. Try again.')
    })
  }
}
