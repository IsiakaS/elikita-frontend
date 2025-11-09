import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabsResComponent } from './labs-res.component';

describe('LabsResComponent', () => {
  let component: LabsResComponent;
  let fixture: ComponentFixture<LabsResComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabsResComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabsResComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
