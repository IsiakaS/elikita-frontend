import { TestBed } from '@angular/core/testing';

import { PatCondHolderService } from './pat-cond-holder.service';

describe('PatCondHolderService', () => {
  let service: PatCondHolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatCondHolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
