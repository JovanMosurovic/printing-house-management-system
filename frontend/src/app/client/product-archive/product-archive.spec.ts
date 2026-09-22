import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductArchive } from './product-archive';

describe('ProductArchive', () => {
  let component: ProductArchive;
  let fixture: ComponentFixture<ProductArchive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductArchive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductArchive);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
