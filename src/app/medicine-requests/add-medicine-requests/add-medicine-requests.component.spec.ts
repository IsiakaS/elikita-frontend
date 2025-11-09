import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMedicineRequestsComponent } from './add-medicine-requests.component';

describe('AddMedicineRequestsComponent', () => {
  let component: AddMedicineRequestsComponent;
  let fixture: ComponentFixture<AddMedicineRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMedicineRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMedicineRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
