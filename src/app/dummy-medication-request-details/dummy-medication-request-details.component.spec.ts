import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DummyMedicationRequestDetailsComponent } from './dummy-medication-request-details.component';

describe('DummyMedicationRequestDetailsComponent', () => {
  let component: DummyMedicationRequestDetailsComponent;
  let fixture: ComponentFixture<DummyMedicationRequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyMedicationRequestDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DummyMedicationRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
