import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { patCondResolver } from './pat-cond.resolver';

describe('patCondResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => patCondResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
