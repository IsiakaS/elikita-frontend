import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecimensComponent } from './specimens.component';

describe('SpecimensComponent', () => {
  let component: SpecimensComponent;
  let fixture: ComponentFixture<SpecimensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecimensComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecimensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
