import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FlashService } from './flash.service';

describe('FlashService', () => {
  let service: FlashService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(FlashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
