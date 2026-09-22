import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterAuctions } from './printer-auctions';

describe('PrinterAuctions', () => {
  let component: PrinterAuctions;
  let fixture: ComponentFixture<PrinterAuctions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterAuctions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterAuctions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
