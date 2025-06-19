import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEncounterComponent } from './add-encounter.component';

describe('AddEncounterComponent', () => {
  let component: AddEncounterComponent;
  let fixture: ComponentFixture<AddEncounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEncounterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEncounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
