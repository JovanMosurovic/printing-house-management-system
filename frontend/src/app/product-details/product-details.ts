import {Component, inject} from '@angular/core';
import {ProductService} from '../services/product.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {PublicProductDetailsModel} from '../models/product';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private productService = inject(ProductService);
  private activatedRoute = inject(ActivatedRoute);

  product: PublicProductDetailsModel | null = null;
  images: string[] = [];
  selectedImage = "";
  message = "";

  ngOnInit() {
    let productId =
      this.activatedRoute.snapshot.paramMap.get("productId");

    if (productId == null) {
      this.message = "Product ID is missing.";
      return;
    }

    this.productService.getProductDetails(productId).subscribe({
      next: data => {
        this.product = data;
        this.images = [];

        if (data.slikaUrl) {
          this.images.push(data.slikaUrl);
        }

        for (let image of data.dodatneSlike) {
          if (image) {
            this.images.push(image);
          }
        }

        if (this.images.length > 0) {
          let savedImageIndex = this.getSavedImageIndex();
          this.selectedImage = this.images[savedImageIndex];
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message =
            "Unexpected error while loading product details.";
        }
      }
    });
  }

  selectImage(imageIndex: number) {
    if (this.product == null) return;

    this.selectedImage = this.images[imageIndex];

    let cookieName =
      `productMainImage_${this.product._id}`;

    document.cookie =
      `${cookieName}=${imageIndex}; max-age=${60 * 60 * 24 * 30}; path=/`;
  }

  private getSavedImageIndex() {
    if (this.product == null) return 0;

    let cookieName =
      `productMainImage_${this.product._id}`;

    let cookies = document.cookie.split("; ");

    for (let cookie of cookies) {
      if (cookie.startsWith(`${cookieName}=`)) {
        let imageIndex = Number(cookie.split("=")[1]);

        if (Number.isInteger(imageIndex) &&
          imageIndex >= 0 &&
          imageIndex < this.images.length) {
          return imageIndex;
        }
      }
    }

    return 0;
  }


}
