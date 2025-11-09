import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckSheetComponent } from './check-sheet.component';

describe('CheckSheetComponent', () => {
  let component: CheckSheetComponent;
  let fixture: ComponentFixture<CheckSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
