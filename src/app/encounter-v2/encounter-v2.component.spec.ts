import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncounterV2Component } from './encounter-v2.component';

describe('EncounterV2Component', () => {
  let component: EncounterV2Component;
  let fixture: ComponentFixture<EncounterV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncounterV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncounterV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
