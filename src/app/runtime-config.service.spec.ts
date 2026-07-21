import { resolveDemoMode, RuntimeConfigService } from './runtime-config.service'

describe('resolveDemoMode', () => {
  it('enables demo mode when the URL explicitly requests it', () => {
    expect(resolveDemoMode({}, 'http://localhost:4200/?demo=1')).toBeTrue()
  })

  it('enables demo mode for the public GitHub Pages deployment', () => {
    expect(resolveDemoMode({}, 'https://jchronister2.github.io/Flashcards/')).toBeTrue()
  })

  it('preserves authenticated mode for a configured self-hosted deployment', () => {
    expect(resolveDemoMode({ demoMode: false }, 'https://flashcards.example.com/')).toBeFalse()
  })

  it('does not allow a query string to disable a forced public demo', () => {
    expect(resolveDemoMode({ demoMode: true }, 'https://jchronister2.github.io/Flashcards/?demo=0')).toBeTrue()
  })
})

describe('RuntimeConfigService', () => {
  it('keeps explicitly selected demo mode after client-side navigation', () => {
    const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    window.history.pushState({}, '', '/?demo=1')
    const service = new RuntimeConfigService()

    window.history.pushState({}, '', '/#/study')

    expect(service.isDemoMode).toBeTrue()
    window.history.replaceState({}, '', originalPath)
  })
})
