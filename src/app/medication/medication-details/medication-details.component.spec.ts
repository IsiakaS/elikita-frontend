import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationDetailsComponent } from './medication-details.component';

describe('MedicationDetailsComponent', () => {
  let component: MedicationDetailsComponent;
  let fixture: ComponentFixture<MedicationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
