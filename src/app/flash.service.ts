import { GoogleSheetsService } from 'src/app/google-sheets.service'

import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class FlashService {
  public answer: string = ''
  public currentFlashcard: any
  public feedback: string = ''
  public flashcards: string[][] = []
  public isAnsweredCorrectly: boolean = false
  public isForceCorrectAnswer: boolean = false
  public previousFlashcardIndex: number | null = null

  constructor(private _sheetsService: GoogleSheetsService) { }

  /** Shows the next card based on spaced repetition */
  showNextFlashcard() {
    const currentDate = new Date()
    const randomChance = 1 / 20 // 1/20 chance for a completely random flashcard selection
    const windowSize = 5 // Window of top 5 flashcards based on weight

    let nextFlashcardIndex = null // Initialize next flashcard index

    // Step 1: Random Flashcard Selection (1/20 chance)
    if (Math.random() < randomChance) {
      let randomIndex = Math.floor(Math.random() * this.flashcards.length)

      // Ensure the random card is not the same as the last one
      while (randomIndex === this.previousFlashcardIndex) {
        randomIndex = Math.floor(Math.random() * this.flashcards.length)
      }

      console.log('Random card selected:', randomIndex)
      nextFlashcardIndex = randomIndex
    }
    else {
      // Step 2: Spaced Repetition Logic
      let weights = this.flashcards.map((flashcard, index) => {
        const correctCount = parseInt(flashcard[2]) || 0 // Column C
        const incorrectCount = parseInt(flashcard[3]) || 0 // Column D
        const lastCorrectDate = flashcard[4] ? new Date(flashcard[4]) : new Date(0) // Column E
        const daysSinceLastCorrect = Math.floor((currentDate.getTime() - lastCorrectDate.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate the weight for spaced repetition
        let weight = (incorrectCount + 1) * (daysSinceLastCorrect + 1) / (correctCount + 1)

        return { index, weight }
      })

      // Sort by weight in descending order (higher weight = higher priority)
      weights.sort((a, b) => b.weight - a.weight)

      // Select the top 10 (or fewer) flashcards based on weight
      const topFlashcards = weights.slice(0, Math.min(windowSize, weights.length))

      // Calculate total weight of the top flashcards (for weighted random selection)
      const totalWeight = topFlashcards.reduce((sum, flashcard) => sum + flashcard.weight, 0)

      // Select one flashcard randomly, but proportionally to its weight
      let randomValue = Math.random() * totalWeight

      for (let i = 0; i < topFlashcards.length; i++) {
        randomValue -= topFlashcards[i].weight
        if (randomValue <= 0) {
          nextFlashcardIndex = topFlashcards[i].index
          break
        }
      }

      console.log('Next flashcard index (spaced repetition):', nextFlashcardIndex)
    }

    // Step 3: Final Check to Ensure No Repetition
    if (nextFlashcardIndex === this.previousFlashcardIndex) {
      console.log('Selected flashcard is the same as previous. Selecting next available.')

      // Fallback to select a different card if the same as the previous one
      nextFlashcardIndex = (nextFlashcardIndex + 1) % this.flashcards.length
    }

    // Step 4: Update and Display the Next Flashcard
    this.currentFlashcard = this.flashcards[nextFlashcardIndex]
    this.previousFlashcardIndex = nextFlashcardIndex

    this.answer = ''
    this.feedback = ''
    this.isForceCorrectAnswer = false
  }

  submitAnswer() {
    if (this.isForceCorrectAnswer) {
      if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
        this.feedback = 'Correct! Moving on to the next question.'

        setTimeout(() => this.showNextFlashcard(), 500)
      } else {
        this.feedback = `Please input the correct answer to proceed: ${this.currentFlashcard[1]}`
      }
      return
    }

    if (this.answer.toLowerCase() === this.currentFlashcard[1].toLowerCase()) {
      this.feedback = 'Correct!'
      this.isAnsweredCorrectly = true
      this.updateFlashcardScore(true)

      setTimeout(() => this.showNextFlashcard(), 500)
    } else {
      this.feedback = `Wrong! The correct answer is: ${this.currentFlashcard[1]}. Please input the correct answer to proceed.`
      this.isAnsweredCorrectly = false
      this.isForceCorrectAnswer = true
      this.updateFlashcardScore(false)
    }
  }

  updateFlashcardScore(isCorrect: boolean) {
    if (isCorrect) {
      this.currentFlashcard[2] = (parseInt(this.currentFlashcard[2]) || 0) + 1
      const now = new Date()
      this.currentFlashcard[4] = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    } else {
      this.currentFlashcard[3] = (parseInt(this.currentFlashcard[3]) || 0) + 1
    }

    // Here you would update the Google Sheet with the new values.
    const spreadsheetId = '1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE'
    const range = `Words!A${this.flashcards.indexOf(this.currentFlashcard) + 2}:F`

    this._sheetsService.updateFlashcard(spreadsheetId, range, this.currentFlashcard).subscribe(() => {
      console.log('Flashcard updated successfully')
    })
  }

  loadFlashcards() {
    const spreadsheetId = '1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE'
    const range = 'Words!A2:F'

    this._sheetsService.getFlashcards(spreadsheetId, range).subscribe((response: any) => {
      this.flashcards = response.values.filter((row: any[]) =>
        row[0] && row[1] // Ensure front side and back side are not empty
      )

      this.showNextFlashcard()
    })
  }
}