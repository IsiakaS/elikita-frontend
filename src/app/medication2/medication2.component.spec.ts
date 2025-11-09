import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Medication2Component } from './medication2.component';

describe('Medication2Component', () => {
  let component: Medication2Component;
  let fixture: ComponentFixture<Medication2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Medication2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Medication2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
