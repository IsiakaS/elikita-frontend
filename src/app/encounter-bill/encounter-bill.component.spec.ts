import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncounterBillComponent } from './encounter-bill.component';

describe('EncounterBillComponent', () => {
  let component: EncounterBillComponent;
  let fixture: ComponentFixture<EncounterBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncounterBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncounterBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
