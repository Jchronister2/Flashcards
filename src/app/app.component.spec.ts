import { BehaviorSubject } from 'rxjs'

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { RouterTestingModule } from '@angular/router/testing'

import { AppComponent } from './app.component'
import { FlashService } from './flash.service'
import { GoogleAuthService } from './google-auth.service'

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>
  let component: AppComponent
  let flashService: jasmine.SpyObj<FlashService>

  beforeEach(() => {
    localStorage.clear()
    flashService = jasmine.createSpyObj<FlashService>('FlashService', ['selectDeck', 'createDeck'], {
      flashcards: [],
      decks: [],
      currentDeck: null
    })
    const authService = {
      user$: new BehaviorSubject(null),
      isPreviewMode: false,
      isAuthenticated: () => false,
      initializeClient: () => undefined,
      signIn: () => undefined,
      signOut: () => undefined
    }

    TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: FlashService, useValue: flashService },
        { provide: GoogleAuthService, useValue: authService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('creates the app', () => {
    expect(component).toBeTruthy()
  })

  it('persists the selected theme', () => {
    component.toggleTheme()

    expect(component.isDarkMode).toBeTrue()
    expect(localStorage.getItem('flashcards_theme')).toBe('dark')
  })

  it('creates a trimmed deck name', () => {
    component.newDeckName = '  Spanish  '
    component.showCreateDeckForm = true

    component.createDeck()

    expect(flashService.createDeck).toHaveBeenCalledOnceWith('Spanish')
    expect(component.showCreateDeckForm).toBeFalse()
  })
})
