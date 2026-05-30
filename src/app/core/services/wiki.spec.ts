import { TestBed } from '@angular/core/testing';

import { Wiki } from './wiki';

describe('Wiki', () => {
  let service: Wiki;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Wiki);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
