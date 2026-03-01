import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConductorListComponent } from './conductor-list';

describe('ConductorListComponent', () => {
  let component: ConductorListComponent;
  let fixture: ComponentFixture<ConductorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConductorListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ConductorListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
