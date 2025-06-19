import { TestBed } from '@angular/core/testing';

import { FormFieldsSelectDataService } from './form-fields-select-data.service';

describe('FormFieldsSelectDataService', () => {
  let service: FormFieldsSelectDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormFieldsSelectDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
