import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPreparation } from './product-preparation';

describe('ProductPreparation', () => {
  let component: ProductPreparation;
  let fixture: ComponentFixture<ProductPreparation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPreparation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductPreparation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
