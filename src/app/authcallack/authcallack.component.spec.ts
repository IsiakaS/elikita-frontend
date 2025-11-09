import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthcallackComponent } from './authcallack.component';

describe('AuthcallackComponent', () => {
  let component: AuthcallackComponent;
  let fixture: ComponentFixture<AuthcallackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthcallackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthcallackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
