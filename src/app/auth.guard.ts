import { Observable } from 'rxjs'

import { Injectable } from '@angular/core'
import { Router, UrlTree } from '@angular/router'

@Injectable({
    providedIn: 'root'
})
export class AuthGuard {
    constructor(private router: Router) { }

    canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> {
        const token = localStorage.getItem('google_token')
        if (!token) {
            return this.router.createUrlTree(['/login'])
        }
        return true
    }
} 