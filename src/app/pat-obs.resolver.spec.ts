import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { patObsResolver } from './pat-obs.resolver';

describe('patObsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => patObsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
