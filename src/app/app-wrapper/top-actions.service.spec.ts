import { TestBed } from '@angular/core/testing';

import { TopActionsService } from './top-actions.service';

describe('TopActionsService', () => {
  let service: TopActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
