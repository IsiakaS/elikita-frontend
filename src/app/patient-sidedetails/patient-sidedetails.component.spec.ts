import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSidedetailsComponent } from './patient-sidedetails.component';

describe('PatientSidedetailsComponent', () => {
  let component: PatientSidedetailsComponent;
  let fixture: ComponentFixture<PatientSidedetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSidedetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSidedetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
