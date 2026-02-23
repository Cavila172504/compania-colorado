import { TestBed } from '@angular/core/testing';

import { Conductores } from './conductores';

describe('Conductores', () => {
  let service: Conductores;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Conductores);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
