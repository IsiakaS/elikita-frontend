import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatSympComponent } from './pat-symp.component';

describe('PatSympComponent', () => {
  let component: PatSympComponent;
  let fixture: ComponentFixture<PatSympComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatSympComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatSympComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
