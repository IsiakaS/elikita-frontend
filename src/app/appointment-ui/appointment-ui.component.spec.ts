import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentUiComponent } from './appointment-ui.component';

describe('AppointmentUiComponent', () => {
  let component: AppointmentUiComponent;
  let fixture: ComponentFixture<AppointmentUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentUiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
