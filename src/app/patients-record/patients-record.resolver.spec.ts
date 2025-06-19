import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { patientsRecordResolver } from './patients-record.resolver';

describe('patientsRecordResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => patientsRecordResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
