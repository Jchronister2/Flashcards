import { Injectable } from '@angular/core'

const CLIENT_ID = '249508522283-12oe76736pr2iknoefl5rd8li61dfbec.apps.googleusercontent.com'
const API_KEY = 'AIzaSyBWu0Vsv8xo0Jx2X6snOEzoBo4uSjA5LtI'
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

declare var gapi: any
declare var google: any

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public tokenClient
  public gapiInited = false
  public gisInited = false

  get isSignedIn() { return this.tokenClient }
  get isInitialized() { return this.gisInited }

  constructor() { }

  init() {
    this.initializeGapiClient()
    this.initializeGis()
  }

  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
   */
  async initializeGapiClient() {
    gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      })
      this.gapiInited = true
    })
  }

  /**
   * Callback after Google Identity Services are loaded.
   */
  initializeGis() {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    })
    this.gisInited = true
  }

  /** Sign in the user upon button click. */
  handleAuthClick() {
    this.tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp)
      }
    }

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      this.tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      this.tokenClient.requestAccessToken({ prompt: '' })
    }
  }

  /**
   *  Sign out the user upon button click.
   */
  handleSignoutClick() {
    const token = gapi.client.getToken()

    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token)
      gapi.client.setToken('')
      document.getElementById('content').innerText = ''
      document.getElementById('authorize_button').innerText = 'Authorize'
      document.getElementById('signout_button').style.visibility = 'hidden'
    }
  }
}