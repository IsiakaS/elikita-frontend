import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientsRecordComponent } from './patients-record.component';

describe('PatientsRecordComponent', () => {
  let component: PatientsRecordComponent;
  let fixture: ComponentFixture<PatientsRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientsRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientsRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
