import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncounterCheckComponent } from './encounter-check.component';

describe('EncounterCheckComponent', () => {
  let component: EncounterCheckComponent;
  let fixture: ComponentFixture<EncounterCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncounterCheckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncounterCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
