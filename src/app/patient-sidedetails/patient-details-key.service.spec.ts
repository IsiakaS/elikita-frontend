import { TestBed } from '@angular/core/testing';

import { PatientDetailsKeyService } from './patient-details-key.service';

describe('PatientDetailsKeyService', () => {
  let service: PatientDetailsKeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatientDetailsKeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
