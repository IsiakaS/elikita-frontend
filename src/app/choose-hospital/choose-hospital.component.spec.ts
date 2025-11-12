import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseHospitalComponent } from './choose-hospital.component';

describe('ChooseHospitalComponent', () => {
  let component: ChooseHospitalComponent;
  let fixture: ComponentFixture<ChooseHospitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseHospitalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseHospitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
