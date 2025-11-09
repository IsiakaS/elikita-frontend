import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabreportComponent } from './labreport.component';

describe('LabreportComponent', () => {
  let component: LabreportComponent;
  let fixture: ComponentFixture<LabreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabreportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
