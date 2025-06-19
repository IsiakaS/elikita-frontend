import { TestBed } from '@angular/core/testing';
import { CanActivateChildFn } from '@angular/router';

import { appAuthGuard } from './app-auth.guard';

describe('appAuthGuard', () => {
  const executeGuard: CanActivateChildFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => appAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
