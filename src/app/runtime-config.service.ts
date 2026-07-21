import { Injectable } from '@angular/core'

export interface FlashcardsRuntimeConfig {
  googleClientId?: string
  demoMode?: boolean
}

export function resolveDemoMode(config: FlashcardsRuntimeConfig, url: string): boolean {
  const parsed = new URL(url)
  const requestedMode = parsed.searchParams.get('demo')

  if (config.demoMode === true) return true
  if (requestedMode === '1') return true
  if (requestedMode === '0') return false
  if (config.demoMode === false) return false

  return parsed.hostname.toLowerCase().endsWith('.github.io')
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly config: FlashcardsRuntimeConfig = window.flashcardsConfig ?? {}
  private readonly demoMode = resolveDemoMode(this.config, window.location.href)

  get isDemoMode(): boolean {
    return this.demoMode
  }

  get googleClientId(): string {
    return this.config.googleClientId?.trim() ?? ''
  }
}
