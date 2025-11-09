import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeAppointmentsComponent } from './make-appointments.component';

describe('MakeAppointmentsComponent', () => {
  let component: MakeAppointmentsComponent;
  let fixture: ComponentFixture<MakeAppointmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeAppointmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakeAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
