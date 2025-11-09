import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVitalsComponent } from './add-vitals.component';

describe('AddVitalsComponent', () => {
  let component: AddVitalsComponent;
  let fixture: ComponentFixture<AddVitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVitalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVitalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
