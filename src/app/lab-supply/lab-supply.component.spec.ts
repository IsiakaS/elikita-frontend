import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabSupplyComponent } from './lab-supply.component';

describe('LabSupplyComponent', () => {
  let component: LabSupplyComponent;
  let fixture: ComponentFixture<LabSupplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabSupplyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
