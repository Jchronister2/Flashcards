import { Observable } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router, UrlTree } from '@angular/router'

import { GoogleAuthService } from './google-auth.service'

@Injectable({
    providedIn: 'root'
})
export class AuthGuard {
    constructor(
        private router: Router,
        private authService: GoogleAuthService
    ) { }

    canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> {
        if (!this.authService.isAuthenticated()) {
            return this.router.createUrlTree(['/login'])
        }
        return true
    }
} 