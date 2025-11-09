import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseObservationCategoryComponent } from './choose-observation-category.component';

describe('ChooseObservationCategoryComponent', () => {
  let component: ChooseObservationCategoryComponent;
  let fixture: ComponentFixture<ChooseObservationCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseObservationCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseObservationCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
