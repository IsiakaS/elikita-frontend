import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientConditionComponent } from './patient-condition.component';

describe('PatientConditionComponent', () => {
  let component: PatientConditionComponent;
  let fixture: ComponentFixture<PatientConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientConditionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
