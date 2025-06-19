import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { medReqResResolver } from './med-req-res.resolver';

describe('medReqResResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => medReqResResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
