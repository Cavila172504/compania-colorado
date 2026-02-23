import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConductorList } from './conductor-list';

describe('ConductorList', () => {
  let component: ConductorList;
  let fixture: ComponentFixture<ConductorList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConductorList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConductorList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
