import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFlashcardModalComponent } from './edit-flashcard-modal.component';

describe('EditFlashcardModalComponent', () => {
  let component: EditFlashcardModalComponent;
  let fixture: ComponentFixture<EditFlashcardModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
