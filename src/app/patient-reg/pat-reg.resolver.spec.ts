import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { patRegResolver } from './pat-reg.resolver';

describe('patRegResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => patRegResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
