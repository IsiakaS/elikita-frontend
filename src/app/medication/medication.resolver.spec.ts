import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { medicationResolver } from './medication.resolver';

describe('medicationResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => medicationResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
