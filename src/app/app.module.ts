import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { RouterModule } from '@angular/router'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { DecksComponent } from './decks/decks.component'
import { EditFlashcardModalComponent } from './edit-flashcard-modal/edit-flashcard-modal.component'
import { ProfileComponent } from './profile/profile.component'
import { StudyComponent } from './study/study.component'
import { StudyInsightsComponent } from './study-insights/study-insights.component'

@NgModule({ declarations: [
        AppComponent,
        DecksComponent,
        EditFlashcardModalComponent,
        ProfileComponent,
        StudyComponent,
        StudyInsightsComponent
    ],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
