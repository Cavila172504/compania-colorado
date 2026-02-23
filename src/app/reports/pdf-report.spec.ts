import { TestBed } from '@angular/core/testing';

import { PdfReport } from './pdf-report';

describe('PdfReport', () => {
  let service: PdfReport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfReport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
