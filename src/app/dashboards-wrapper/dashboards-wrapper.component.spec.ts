import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardsWrapperComponent } from './dashboards-wrapper.component';

describe('DashboardsWrapperComponent', () => {
  let component: DashboardsWrapperComponent;
  let fixture: ComponentFixture<DashboardsWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardsWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardsWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
