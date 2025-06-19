import { TestBed } from '@angular/core/testing';

import { PatObsRecordHolderService } from './pat-obs-record-holder.service';

describe('PatObsRecordHolderService', () => {
  let service: PatObsRecordHolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatObsRecordHolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
