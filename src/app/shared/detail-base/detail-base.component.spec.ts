import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailBaseComponent } from './detail-base.component';

describe('DetailBaseComponent', () => {
  let component: DetailBaseComponent;
  let fixture: ComponentFixture<DetailBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailBaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
