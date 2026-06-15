import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearArticuloComponent } from './crear-articulo';

describe('CrearArticuloComponent', () => {
  let component: CrearArticuloComponent;
  let fixture: ComponentFixture<CrearArticuloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearArticuloComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearArticuloComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
