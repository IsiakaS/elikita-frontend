import { TestBed } from '@angular/core/testing';

import { LinkInReferencesService } from './link-in-references.service';

describe('LinkInReferencesService', () => {
  let service: LinkInReferencesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinkInReferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
