import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadUiComponent } from './upload-ui.component';

describe('UploadUiComponent', () => {
  let component: UploadUiComponent;
  let fixture: ComponentFixture<UploadUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadUiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
