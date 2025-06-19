import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopbreadcrumbComponent } from './topbreadcrumb.component';

describe('TopbreadcrumbComponent', () => {
  let component: TopbreadcrumbComponent;
  let fixture: ComponentFixture<TopbreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbreadcrumbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopbreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
