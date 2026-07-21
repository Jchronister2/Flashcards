import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { EditFlashcardModalComponent } from './edit-flashcard-modal.component';

describe('EditFlashcardModalComponent', () => {
  let component: EditFlashcardModalComponent;
  let fixture: ComponentFixture<EditFlashcardModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EditFlashcardModalComponent]
    });
    fixture = TestBed.createComponent(EditFlashcardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
