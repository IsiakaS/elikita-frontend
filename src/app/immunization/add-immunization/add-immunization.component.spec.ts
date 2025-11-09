import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddImmunizationComponent } from './add-immunization.component';

describe('AddImmunizationComponent', () => {
  let component: AddImmunizationComponent;
  let fixture: ComponentFixture<AddImmunizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddImmunizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddImmunizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
