import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculoDetail } from './vehiculo-detail';

describe('VehiculoDetail', () => {
  let component: VehiculoDetail;
  let fixture: ComponentFixture<VehiculoDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculoDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculoDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
