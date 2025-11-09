import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhenSeverityComponent } from './when-severity.component';

describe('WhenSeverityComponent', () => {
  let component: WhenSeverityComponent;
  let fixture: ComponentFixture<WhenSeverityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhenSeverityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhenSeverityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
