import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterProducts } from './printer-products';

describe('PrinterProducts', () => {
  let component: PrinterProducts;
  let fixture: ComponentFixture<PrinterProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
