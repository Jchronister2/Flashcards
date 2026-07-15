import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { FlashService } from './flash.service';
import { GoogleAuthService } from './google-auth.service';
import { BehaviorSubject } from 'rxjs';

class DemoAuthStub {
  readonly user$ = new BehaviorSubject({ name: 'Public demo' })
  isAuthenticated() { return true }
  initializeClient = jasmine.createSpy('initializeClient')
  signIn() { }
  signOut() { }
}

class DemoFlashStub {
  readonly isDemoMode = true
  readonly flashcards = []
  resetDemoData = jasmine.createSpy('resetDemoData')
}

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule, HttpClientTestingModule],
    declarations: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      { provide: GoogleAuthService, useClass: DemoAuthStub },
      { provide: FlashService, useClass: DemoFlashStub }
    ]
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows demo controls and resets public sample data', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const flashService = TestBed.inject(FlashService) as unknown as DemoFlashStub
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.demo-badge')?.textContent).toContain('Demo')
    fixture.nativeElement.querySelector('.reset-demo-button').click()
    expect(flashService.resetDemoData).toHaveBeenCalled()
  })

  it('leaves OAuth client initialization to the auth service loader', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const authService = TestBed.inject(GoogleAuthService) as unknown as DemoAuthStub

    fixture.detectChanges()

    expect(authService.initializeClient).not.toHaveBeenCalled()
  })

});
