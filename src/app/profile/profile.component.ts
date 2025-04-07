import { Component } from '@angular/core'
import { Router } from '@angular/router'

import { GoogleAuthService } from '../google-auth.service'

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
    isMenuOpen = false

    get user() { return this._authService.user$.getValue() }

    constructor(
        private _authService: GoogleAuthService,
        private _router: Router
    ) { }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen
    }

    closeMenu() {
        this.isMenuOpen = false
    }

    onLogout() {
        this._authService.signOut()
        this._router.navigate(['/login'])
    }

    handleImageError(event: Event) {
        const img = event.target as HTMLImageElement
        img.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }
} 