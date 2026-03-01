import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaListComponent } from './ruta-list';

describe('RutaListComponent', () => {
  let component: RutaListComponent;
  let fixture: ComponentFixture<RutaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutaListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RutaListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
