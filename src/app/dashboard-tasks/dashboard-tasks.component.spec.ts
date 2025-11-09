import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTasksComponent } from './dashboard-tasks.component';

describe('DashboardTasksComponent', () => {
  let component: DashboardTasksComponent;
  let fixture: ComponentFixture<DashboardTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
