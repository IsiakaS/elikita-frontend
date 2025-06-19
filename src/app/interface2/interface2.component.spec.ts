import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Interface2Component } from './interface2.component';

describe('Interface2Component', () => {
  let component: Interface2Component;
  let fixture: ComponentFixture<Interface2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Interface2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Interface2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
