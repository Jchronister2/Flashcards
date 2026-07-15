import { TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'

import { GoogleAuthService } from './google-auth.service'
import { RuntimeConfigService } from './runtime-config.service'

class DemoRuntimeConfig {
  readonly isDemoMode = true
  readonly googleClientId = ''
}

class AuthenticatedRuntimeConfig {
  readonly isDemoMode = false
  readonly googleClientId = 'test-client-id'
}

describe('GoogleAuthService demo mode', () => {
  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: RuntimeConfigService, useClass: DemoRuntimeConfig }]
    })
  })

  it('treats the public demo as authenticated without an OAuth token', () => {
    const service = TestBed.inject(GoogleAuthService)

    expect(service.isAuthenticated()).toBeTrue()
    expect(service.user$.getValue()?.name).toBe('Public demo')
    expect(document.querySelector('script[data-google-identity-client]')).toBeNull()
  })
})

describe('GoogleAuthService authenticated mode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.querySelectorAll('script[data-google-identity-client]').forEach(script => script.remove())
    ;(window as any).google = undefined
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: RuntimeConfigService, useClass: AuthenticatedRuntimeConfig }]
    })
  })

  afterEach(() => {
    document.querySelectorAll('script[data-google-identity-client]').forEach(script => script.remove())
    ;(window as any).google = undefined
  })

  it('waits for Google Identity Services before requesting a token', async () => {
    const requestAccessToken = jasmine.createSpy('requestAccessToken')
    const initTokenClient = jasmine.createSpy('initTokenClient').and.returnValue({ requestAccessToken })
    const service = TestBed.inject(GoogleAuthService)

    const signIn = service.signIn()
    expect(requestAccessToken).not.toHaveBeenCalled()

    ;(window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient,
          revoke: jasmine.createSpy('revoke')
        }
      }
    }
    const script = document.querySelector<HTMLScriptElement>('script[data-google-identity-client]')
    expect(script).not.toBeNull()
    script?.dispatchEvent(new Event('load'))
    await signIn

    expect(initTokenClient).toHaveBeenCalled()
    expect(requestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' })
  })
})
