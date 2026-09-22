import {Component, inject} from '@angular/core';
import {ProductService} from '../services/product.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ProductModel} from '../models/product';
import {AuthService} from '../services/auth.service';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private productService = inject(ProductService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  product: ProductModel | null = null;
  images: string[] = [];
  selectedImage = "";
  selectedColor = "";
  selectedPrintingServiceId = "";
  mapUrl: SafeResourceUrl | null = null;
  isClient = false;
  loggedUserId = "";
  message = "";

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();
    this.isClient = loggedUser?.role == "individualClient" || loggedUser?.role == "businessClient";
    this.loggedUserId = loggedUser?._id || "";

    let productId =
      this.activatedRoute.snapshot.paramMap.get("productId");

    if (productId == null) {
      this.message = "Product ID is missing.";
      return;
    }

    this.productService.getProductDetails(productId).subscribe({
      next: data => {
        this.product = data;
        this.selectedColor = data.dostupneBoje[0] || "Bela";
        this.selectedPrintingServiceId = data.uslugeStampe[0]?.idUsluge || "";
        this.images = [];

        if (data.adresaStamparije || data.grad) {
          let location = `${data.adresaStamparije}, ${data.grad}`;
          let url = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }

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

  continueToPreparation() {
    if (this.product == null) return;

    this.router.navigate(["/product", this.product._id, "preparation"], {
      queryParams: {
        color: this.selectedColor,
        printingServiceId: this.selectedPrintingServiceId
      }
    });
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
