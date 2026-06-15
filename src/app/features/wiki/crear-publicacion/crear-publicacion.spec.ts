import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPublicacionComponent } from './crear-publicacion';

describe('CrearPublicacionComponent', () => {
  let component: CrearPublicacionComponent;
  let fixture: ComponentFixture<CrearPublicacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPublicacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPublicacionComponent);

  import { DetalleArticuloComponent } from './detalle-articulo';

describe('DetalleArticuloComponent', () => {
  let component: DetalleArticuloComponent;
  let fixture: ComponentFixture<DetalleArticuloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleArticuloComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleArticuloComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
