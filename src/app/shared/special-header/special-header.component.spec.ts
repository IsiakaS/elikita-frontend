import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialHeaderComponent } from './special-header.component';

describe('SpecialHeaderComponent', () => {
  let component: SpecialHeaderComponent;
  let fixture: ComponentFixture<SpecialHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
