import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAdmissionWrapperComponent } from './patient-admission-wrapper.component';

describe('PatientAdmissionWrapperComponent', () => {
  let component: PatientAdmissionWrapperComponent;
  let fixture: ComponentFixture<PatientAdmissionWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAdmissionWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAdmissionWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
