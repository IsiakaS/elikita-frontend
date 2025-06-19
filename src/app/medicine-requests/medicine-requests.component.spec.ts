import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicineRequestsComponent } from './medicine-requests.component';

describe('MedicineRequestsComponent', () => {
  let component: MedicineRequestsComponent;
  let fixture: ComponentFixture<MedicineRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicineRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicineRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
