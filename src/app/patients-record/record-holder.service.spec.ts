import { TestBed } from '@angular/core/testing';

import { RecordHolderService } from './record-holder.service';

describe('RecordHolderService', () => {
  let service: RecordHolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecordHolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
