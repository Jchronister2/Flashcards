import { Component, Input } from '@angular/core'

import type { Flashcard } from '../google-sheets.service'

export interface StudyActivityDay {
  label: string
  level: number
}

@Component({
  selector: 'app-study-insights',
  templateUrl: './study-insights.component.html',
  styleUrls: ['./study-insights.component.css'],
  standalone: false
})
export class StudyInsightsComponent {
  @Input() masteryScore = 0
  @Input() dueCount = 0
  @Input() streakDays = 0
  @Input() weekActivity: StudyActivityDay[] = []
  @Input() upcomingCards: Flashcard[] = []
}
