import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipsDisplayComponent } from './chips-display.component';

describe('ChipsDisplayComponent', () => {
  let component: ChipsDisplayComponent;
  let fixture: ComponentFixture<ChipsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipsDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChipsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
