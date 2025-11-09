import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabrequestDetailsComponent } from './labrequest-details.component';

describe('LabrequestDetailsComponent', () => {
  let component: LabrequestDetailsComponent;
  let fixture: ComponentFixture<LabrequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabrequestDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabrequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
