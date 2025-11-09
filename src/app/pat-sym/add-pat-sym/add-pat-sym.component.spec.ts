import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPatSymComponent } from './add-pat-sym.component';

describe('AddPatSymComponent', () => {
  let component: AddPatSymComponent;
  let fixture: ComponentFixture<AddPatSymComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPatSymComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPatSymComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
