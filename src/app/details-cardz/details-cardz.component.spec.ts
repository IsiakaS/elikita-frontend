import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsCardzComponent } from './details-cardz.component';

describe('DetailsCardzComponent', () => {
  let component: DetailsCardzComponent;
  let fixture: ComponentFixture<DetailsCardzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsCardzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsCardzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
