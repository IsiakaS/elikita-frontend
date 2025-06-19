import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormsV2Component } from './dynamic-forms-v2.component';

describe('DynamicFormsV2Component', () => {
  let component: DynamicFormsV2Component;
  let fixture: ComponentFixture<DynamicFormsV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormsV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicFormsV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
