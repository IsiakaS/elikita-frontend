import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultantDashboardComponent } from './consultant-dashboard.component';

describe('ConsultantDashboardComponent', () => {
  let component: ConsultantDashboardComponent;
  let fixture: ComponentFixture<ConsultantDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultantDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultantDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
