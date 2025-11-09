import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAllergyComponent } from './add-allergy.component';

describe('AddAllergyComponent', () => {
  let component: AddAllergyComponent;
  let fixture: ComponentFixture<AddAllergyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAllergyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAllergyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
