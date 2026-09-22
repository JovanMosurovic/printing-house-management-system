import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {PrintingServiceModel, ProductModel} from '../models/product';
import {AuthService} from '../services/auth.service';
import {ProductService} from '../services/product.service';

@Component({
  selector: 'app-product-preparation',
  imports: [FormsModule],
  templateUrl: './product-preparation.html',
  styleUrl: './product-preparation.css',
})
export class ProductPreparation implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  product: ProductModel | null = null;
  selectedColor = "";
  selectedPrintingService: PrintingServiceModel | null = null;

  preparationType: "text" | "image" = "text";
  preparationText = "";
  preparationImage = "";
  quantity = 1;

  imageError = "";
  message = "";

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser == null ||
      (loggedUser.role != "individualClient" && loggedUser.role != "businessClient")) {
      this.router.navigate([""]);
      return;
    }

    let productId = this.activatedRoute.snapshot.paramMap.get("productId");

    if (productId == null) {
      this.message = "Product ID is missing.";
      return;
    }

    let requestedColor = this.activatedRoute.snapshot.queryParamMap.get("color") || "";
    let requestedPrintingServiceId = this.activatedRoute.snapshot.queryParamMap.get("printingServiceId") || "";

    this.productService.getProductDetails(productId).subscribe({
      next: data => {
        this.product = data;

        if (data.dostupneBoje.includes(requestedColor)) {
          this.selectedColor = requestedColor;
        } else {
          this.selectedColor = data.dostupneBoje[0] || "Bela";
        }

        for (let printingService of data.uslugeStampe) {
          if (printingService.idUsluge == requestedPrintingServiceId) {
            this.selectedPrintingService = printingService;
          }
        }

        if (this.selectedPrintingService == null && data.uslugeStampe.length > 0) {
          this.selectedPrintingService = data.uslugeStampe[0];
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading product preparation.";
        }
      }
    });
  }

  changePreparationType() {
    this.imageError = "";

    if (this.preparationType == "text") {
      this.preparationImage = "";
    } else {
      this.preparationText = "";
    }
  }

  selectPreparationImage(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.imageError = "";
    this.preparationImage = "";

    if (!file) return;

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.imageError = "The image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      this.preparationImage = reader.result as string;
    };

    reader.onerror = () => {
      this.imageError = "The image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  resetPreparation() {
    this.preparationType = "text";
    this.preparationText = "";
    this.preparationImage = "";
    this.quantity = 1;
    this.imageError = "";
    this.message = "";
  }

  backToDetails() {
    if (this.product == null) return;
    this.router.navigate(["/product", this.product._id]);
  }

}
