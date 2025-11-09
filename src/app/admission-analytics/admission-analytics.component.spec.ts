import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionAnalyticsComponent } from './admission-analytics.component';

describe('AdmissionAnalyticsComponent', () => {
  let component: AdmissionAnalyticsComponent;
  let fixture: ComponentFixture<AdmissionAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmissionAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
