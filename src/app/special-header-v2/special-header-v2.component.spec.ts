import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialHeaderV2Component } from './special-header-v2.component';

describe('SpecialHeaderV2Component', () => {
  let component: SpecialHeaderV2Component;
  let fixture: ComponentFixture<SpecialHeaderV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialHeaderV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialHeaderV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
