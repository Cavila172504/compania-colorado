import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculoListComponent } from './vehiculo-list';

describe('VehiculoListComponent', () => {
  let component: VehiculoListComponent;
  let fixture: ComponentFixture<VehiculoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculoListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VehiculoListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
