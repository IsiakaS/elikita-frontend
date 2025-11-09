import { TestBed } from '@angular/core/testing';

import { ToggleSideNavService } from './toggle-side-nav.service';

describe('ToggleSideNavService', () => {
  let service: ToggleSideNavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToggleSideNavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
