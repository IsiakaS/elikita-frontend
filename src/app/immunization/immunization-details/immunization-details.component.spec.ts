import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImmunizationDetailsComponent } from './immunization-details.component';

describe('ImmunizationDetailsComponent', () => {
  let component: ImmunizationDetailsComponent;
  let fixture: ComponentFixture<ImmunizationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmunizationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImmunizationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
