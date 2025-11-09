import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeableReferenceDisplayComponent } from './codeable-reference-display.component';

describe('CodeableReferenceDisplayComponent', () => {
  let component: CodeableReferenceDisplayComponent;
  let fixture: ComponentFixture<CodeableReferenceDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeableReferenceDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeableReferenceDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
