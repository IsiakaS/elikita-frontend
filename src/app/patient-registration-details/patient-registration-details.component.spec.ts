import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRegistrationDetailsComponent } from './patient-registration-details.component';

describe('PatientRegistrationDetailsComponent', () => {
  let component: PatientRegistrationDetailsComponent;
  let fixture: ComponentFixture<PatientRegistrationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRegistrationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRegistrationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
