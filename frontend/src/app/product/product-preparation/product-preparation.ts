import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {PrintingServiceModel, ProductModel} from '../../models/product';
import {CartItemModel, PreparationType} from '../../models/cart';
import {UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {CartService} from '../../services/cart.service';
import {ProductService} from '../../services/product.service';

@Component({
  selector: 'app-product-preparation',
  imports: [FormsModule],
  templateUrl: './product-preparation.html',
  styleUrl: './product-preparation.css',
})
export class ProductPreparation implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  product: ProductModel | null = null;
  loggedUser: UserModel | null = null;
  selectedColor = "";
  selectedPrintingService: PrintingServiceModel | null = null;

  preparationType: PreparationType = "text";
  preparationText = "";
  preparationImage = "";
  quantity = 1;

  imageError = "";
  message = "";
  messageIsError = false;

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null ||
      (this.loggedUser.role != "individualClient" && this.loggedUser.role != "businessClient")) {
      this.router.navigate([""]);
      return;
    }

    let productId = this.activatedRoute.snapshot.paramMap.get("productId");

    if (productId == null) {
      this.message = "Product ID is missing.";
      this.messageIsError = true;
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
        this.messageIsError = true;
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
    this.messageIsError = false;
  }

  addToCart(preparationForm: NgForm) {
    this.message = "";
    this.messageIsError = false;

    if (preparationForm.invalid || this.imageError) {
      preparationForm.form.markAllAsTouched();
      return;
    }

    if (!Number.isInteger(this.quantity)) {
      this.message = "Quantity must be a whole number.";
      this.messageIsError = true;
      return;
    }

    if (this.preparationType == "text" && !this.preparationText.trim()) {
      this.message = "Please enter the text that should be printed.";
      this.messageIsError = true;
      return;
    }

    if (this.preparationType == "image" && !this.preparationImage) {
      this.message = "Please select the image that should be printed.";
      this.messageIsError = true;
      return;
    }

    if (this.product == null || this.loggedUser == null) return;

    if (this.selectedPrintingService == null) {
      this.message = "A printing service is required.";
      this.messageIsError = true;
      return;
    }

    let cartItems = this.cartService.getCartItems(this.loggedUser._id);
    let quantityInCart = 0;

    for (let cartItem of cartItems) {
      if (cartItem.productId == this.product._id) quantityInCart += cartItem.quantity;
    }

    if (quantityInCart + this.quantity > this.product.kolicinaNaLageru) {
      this.message = "There are not enough products currently in stock.";
      this.messageIsError = true;
      return;
    }

    let data = new CartItemModel();
    data.productId = this.product._id;
    data.printingHouseId = this.product.stamparijaId;
    data.printingHouseName = this.product.nazivStamparije;
    data.productName = this.product.naziv;
    data.productImage = this.product.slikaUrl;
    data.color = this.selectedColor;
    data.printingServiceId = this.selectedPrintingService.idUsluge;
    data.printingType = this.selectedPrintingService.tipStampe;
    data.unitPrice = this.product.jedinicnaCena;
    data.additionalPricePerItem = this.selectedPrintingService.dodatnaCenaPoKomadu;
    data.quantity = this.quantity;
    data.totalPrice = (data.unitPrice + data.additionalPricePerItem) * data.quantity;
    data.preparationType = this.preparationType;
    data.preparationText = this.preparationType == "text" ? this.preparationText.trim() : "";
    data.preparationImage = this.preparationType == "image" ? this.preparationImage : "";

    this.cartService.addToCart(this.loggedUser._id, data);
    this.message = "The product was successfully added to the cart.";
  }

  openCart() {
    this.router.navigate(["/client/cart"]);
  }

  backToDetails() {
    if (this.product == null) return;
    this.router.navigate(["/product", this.product._id]);
  }

}
