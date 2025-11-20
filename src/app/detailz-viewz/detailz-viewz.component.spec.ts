import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailzViewzComponent } from './detailz-viewz.component';

describe('DetailzViewzComponent', () => {
  let component: DetailzViewzComponent;
  let fixture: ComponentFixture<DetailzViewzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailzViewzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailzViewzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
