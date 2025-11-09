import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestingTasksComponent } from './testing-tasks.component';

describe('TestingTasksComponent', () => {
  let component: TestingTasksComponent;
  let fixture: ComponentFixture<TestingTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestingTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestingTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
