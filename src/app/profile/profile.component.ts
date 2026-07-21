import { Component, ElementRef, HostListener } from '@angular/core'
import { Router } from '@angular/router'

import { GoogleAuthService } from '../google-auth.service'

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
    isMenuOpen = false
    copyStatus = ''

    get user() { return this._authService.user$.getValue() }
    get canCopyCodexLoginLink() { return location.hostname === 'localhost' }

    constructor(
        private _authService: GoogleAuthService,
        private _router: Router,
        private _elementRef: ElementRef<HTMLElement>
    ) { }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen
    }

    closeMenu() {
        this.isMenuOpen = false
    }

    @HostListener('document:click', ['$event'])
    closeMenuOnOutsideClick(event: Event) {
        if (!this._elementRef.nativeElement.contains(event.target as Node)) {
            this.closeMenu()
        }
    }

    @HostListener('document:keydown.escape')
    closeMenuOnEscape() {
        this.closeMenu()
    }

    onLogout() {
        this._authService.signOut()
        this._router.navigate(['/login'])
    }

    async copyCodexLoginLink() {
        const url = this._authService.createCodexPreviewLoginUrl()
        if (!url) return

        try {
            await navigator.clipboard.writeText(url)
            this.copyStatus = 'Copied'
        } catch {
            window.prompt('Copy this URL into Codex preview:', url)
            this.copyStatus = 'Ready'
        }

        setTimeout(() => {
            this.copyStatus = ''
        }, 2000)
    }

    handleImageError(event: Event) {
        const img = event.target as HTMLImageElement
        img.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }
} 
