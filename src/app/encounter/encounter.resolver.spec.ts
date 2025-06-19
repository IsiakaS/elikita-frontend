import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { encounterResolver } from './encounter.resolver';

describe('encounterResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => encounterResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
