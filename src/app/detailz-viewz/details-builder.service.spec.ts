import { TestBed } from '@angular/core/testing';

import { DetailsBuilderService } from './details-builder.service';

describe('DetailsBuilderService', () => {
  let service: DetailsBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetailsBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
