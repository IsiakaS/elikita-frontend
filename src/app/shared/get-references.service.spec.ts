import { TestBed } from '@angular/core/testing';

import { GetReferencesService } from './get-references.service';

describe('GetReferencesService', () => {
  let service: GetReferencesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetReferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
