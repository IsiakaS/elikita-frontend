import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { patientsResolver } from './patients.resolver';

describe('patientsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => patientsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
