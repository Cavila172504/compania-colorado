import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaList } from './ruta-list';

describe('RutaList', () => {
  let component: RutaList;
  let fixture: ComponentFixture<RutaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
