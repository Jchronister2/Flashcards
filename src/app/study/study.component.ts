import { Component, OnDestroy, OnInit } from '@angular/core'

import { FlashService } from '../flash.service'
import { Flashcard, GoogleSheetsService } from '../google-sheets.service'

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.css'],
  standalone: false
})
export class StudyComponent implements OnDestroy, OnInit {
  private readonly BOOKMARKS_KEY = 'flashcards_bookmarks'
  private readonly ACTIVITY_KEY = 'flashcards_study_activity'
  public showEditModal = false
  public showOptionsPanel = false
  public editCard: Flashcard | null = null
  public isRevealed = false
  public isFullscreen = false

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

  get isAnsweredCorrectly() {
    return this._flashService.isAnsweredCorrectly
  }

  get isForceCorrectAnswer() {
    return this._flashService.isForceCorrectAnswer
  }

  get tags(): string[] {
    const currentTags = this.currentFlashcard?.tags || ''
    return currentTags
      ? currentTags.split(',').map(tag => tag.trim()).filter(Boolean)
      : []
  }

  get currentCardIndex(): number {
    if (!this.currentFlashcard) return 0
    const index = this.flashcards.indexOf(this.currentFlashcard)
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
    if (!this.flashcards.length) return []
    return this.flashcards
      .filter(card => card !== this.currentFlashcard)
      .slice(0, 5)
  }

  get isBookmarked(): boolean {
    const key = this.currentCardKey()
    return key ? this.getBookmarks().includes(key) : false
  }

  constructor(
    private _flashService: FlashService,
    private _sheetsService: GoogleSheetsService
  ) { }

  ngOnInit() {
    Promise.resolve().then(() => this._flashService.initialize())
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
  }

  onDeckChange(deckId: number | string) {
    const parsedDeckId = Number(deckId)
    if (parsedDeckId && parsedDeckId !== this.currentDeck?.id) {
      this.isRevealed = false
      this._flashService.selectDeck(parsedDeckId)
    }
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
  }

  submitAnswer() {
    this.recordStudyActivity()
    this._flashService.submitAnswer()
    this.answer = ''
    this.isRevealed = false
  }

  revealAnswer() {
    this.isRevealed = true
  }

  markAgain() {
    if (!this.currentFlashcard) return
    this.recordStudyActivity()
    this._flashService.rateCurrentCard(false)
    this.answer = ''
    this.isRevealed = false
  }

  markGood() {
    if (!this.currentFlashcard) return
    this.recordStudyActivity()
    this._flashService.rateCurrentCard(true)
    this.answer = ''
    this.isRevealed = false
  }

  markEasy() {
    this.markGood()
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
      await navigator.clipboard?.writeText(text)
    } catch {
      window.prompt('Copy this card:', text)
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
  }

  speakCard() {
    if (!this.currentFlashcard || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const text = this.isRevealed
      ? `${this.currentFlashcard.front}. ${this.currentFlashcard.back}`
      : this.currentFlashcard.front
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = this.currentDeck?.name.toLowerCase().includes('japanese') ? 'ja-JP' : 'en-US'
    window.speechSynthesis.speak(utterance)
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
    }
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
    return date.toISOString().slice(0, 10)
  }

  hideEditModal() {
    this.showEditModal = false
    this.editCard = null
  }

  saveEdit(updatedFlashcard: Flashcard) {
    if (!this.currentFlashcard) return

    const index = this.flashcards.indexOf(this.currentFlashcard)
    this._sheetsService.updateFlashcard(
      this._flashService.spreadsheetId!,
      this.currentDeck!.name,
      index,
      updatedFlashcard
    ).subscribe(() => {
      this._flashService.selectDeck(this.currentDeck!.id)
      this.hideEditModal()
    })
  }
}
