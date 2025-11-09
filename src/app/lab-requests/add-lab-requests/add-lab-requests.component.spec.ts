import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLabRequestsComponent } from './add-lab-requests.component';

describe('AddLabRequestsComponent', () => {
  let component: AddLabRequestsComponent;
  let fixture: ComponentFixture<AddLabRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLabRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLabRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
