import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { appointmentResolver } from './appointment.resolver';

describe('appointmentResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => appointmentResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
