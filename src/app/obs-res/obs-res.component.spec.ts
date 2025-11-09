import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObsResComponent } from './obs-res.component';

describe('ObsResComponent', () => {
  let component: ObsResComponent;
  let fixture: ComponentFixture<ObsResComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObsResComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObsResComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
