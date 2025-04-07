import { Component } from '@angular/core'
import { Router } from '@angular/router'

import { GoogleAuthService } from '../google-auth.service'

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    constructor(
        private _authService: GoogleAuthService,
        private _router: Router
    ) { }

    onLogin() {
        this._authService.signIn()
    }
} 