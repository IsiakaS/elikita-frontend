import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardzDetailsCheckComponent } from './cardz-details-check.component';

describe('CardzDetailsCheckComponent', () => {
  let component: CardzDetailsCheckComponent;
  let fixture: ComponentFixture<CardzDetailsCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardzDetailsCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardzDetailsCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
