import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { AuthGuard } from './auth.guard'
import { DecksComponent } from './decks/decks.component'
import { LoginComponent } from './login/login.component'
import { StudyComponent } from './study/study.component'

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'decks', component: DecksComponent },
      { path: 'study', component: StudyComponent },
      { path: '', redirectTo: 'study', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
