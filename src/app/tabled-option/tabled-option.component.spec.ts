import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabledOptionComponent } from './tabled-option.component';

describe('TabledOptionComponent', () => {
  let component: TabledOptionComponent;
  let fixture: ComponentFixture<TabledOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabledOptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabledOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
