import { AuthService } from 'src/app/auth.service'
import { GoogleSheetsService } from 'src/app/google-sheets.service'

import { AfterViewInit, Component } from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  public data = []

  get isInitialized() { return this._authService.isInitialized }
  get isSignedIn() { return this._authService.isSignedIn }

  constructor(private _authService: AuthService, private _googleSheetsService: GoogleSheetsService) { }

  ngAfterViewInit(): void {
    this._authService.init()
  }

  handleAuthClick() {
    this._authService.handleAuthClick()
  }

  handleSignoutClick() {
    this._authService.handleSignoutClick()
  }

  getData() {
    this._googleSheetsService.getSheetData('1JwwqwMXVt7CNfCFqBLI_sVuS3J3ELEoTeGWviz1LteE', 'Words!A2:E')
      .then((response) => this.data = response.result.values)
  }
}