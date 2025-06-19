import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { labRequestsResolver } from './lab-requests.resolver';

describe('labRequestsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => labRequestsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
