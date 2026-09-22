import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {ProductService} from '../services/product.service';
import {UserModel} from '../models/user';
import {CategoryModel, PrintingServiceModel, ProductModel} from '../models/product';

@Component({
  selector: 'app-printer-products',
  imports: [FormsModule, RouterLink],
  templateUrl: './printer-products.html',
  styleUrl: './printer-products.css',
})
export class PrinterProducts implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  categories: CategoryModel[] = [];
  products: ProductModel[] = [];

  newProduct = new ProductModel();
  newPrintingService = new PrintingServiceModel();
  newColor = "";

  message = "";
  mainImageError = "";
  additionalImagesError = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || this.loggedUser.role != "printer") {
      this.router.navigate([""]);
      return;
    }

    this.newProduct.dostupneBoje = ["Bela"];
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.productService.getAllCategories().subscribe({
      next: data => {
        this.categories = data;

        if (this.categories.length > 0 && !this.newProduct.kategorija) {
          this.newProduct.kategorija = this.categories[0].naziv;
          this.selectCategory();
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading categories.";
        }
      }
    });
  }

  loadProducts() {
    if (this.loggedUser == null) return;

    this.productService.getPrintingHouseProducts(this.loggedUser._id).subscribe({
      next: data => {
        this.products = data;
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading products.";
        }
      }
    });
  }

  selectCategory() {
    for (let category of this.categories) {
      if (category.naziv == this.newProduct.kategorija) {
        this.newProduct.potkategorija = category.potkategorije[0] || "";
        return;
      }
    }

    this.newProduct.potkategorija = "";
  }

  getSelectedSubcategories() {
    for (let category of this.categories) {
      if (category.naziv == this.newProduct.kategorija) return category.potkategorije;
    }

    return [];
  }

  addColor() {
    let color = this.newColor.trim();

    if (!color) {
      this.message = "Enter a color before adding it.";
      return;
    }

    for (let existingColor of this.newProduct.dostupneBoje) {
      if (existingColor.toLowerCase() == color.toLowerCase()) {
        this.message = "This color has already been added.";
        return;
      }
    }

    this.newProduct.dostupneBoje.push(color);
    this.newColor = "";
    this.message = "";
  }

  removeColor(colorIndex: number) {
    this.newProduct.dostupneBoje.splice(colorIndex, 1);
  }

  addPrintingService() {
    let printingService = this.newPrintingService;

    if (!printingService.idUsluge.trim() || !printingService.tipStampe.trim()) {
      this.message = "Printing service ID and type are required.";
      return;
    }

    if (printingService.dodatnaCenaPoKomadu < 0 || printingService.maxSirinaMm < 1 || printingService.maxVisinaMm < 1) {
      this.message = "Printing service price and dimensions are not valid.";
      return;
    }

    for (let existingService of this.newProduct.uslugeStampe) {
      if (existingService.idUsluge == printingService.idUsluge) {
        this.message = "A printing service with this ID has already been added.";
        return;
      }
    }

    let serviceToAdd = new PrintingServiceModel();
    serviceToAdd.idUsluge = printingService.idUsluge.trim();
    serviceToAdd.tipStampe = printingService.tipStampe.trim();
    serviceToAdd.dodatnaCenaPoKomadu = printingService.dodatnaCenaPoKomadu;
    serviceToAdd.maxSirinaMm = printingService.maxSirinaMm;
    serviceToAdd.maxVisinaMm = printingService.maxVisinaMm;

    this.newProduct.uslugeStampe.push(serviceToAdd);
    this.newPrintingService = new PrintingServiceModel();
    this.message = "";
  }

  removePrintingService(serviceIndex: number) {
    this.newProduct.uslugeStampe.splice(serviceIndex, 1);
  }

  selectMainImage(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.mainImageError = "";
    this.newProduct.slikaUrl = "";

    if (!file) return;

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.mainImageError = "Main image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      this.newProduct.slikaUrl = reader.result as string;
    };

    reader.onerror = () => {
      this.mainImageError = "Main image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  selectAdditionalImages(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.additionalImagesError = "";

    if (!file) return;

    if (this.newProduct.dodatneSlike.length >= 3) {
      this.additionalImagesError = "You can add at most three additional images.";
      input.value = "";
      return;
    }

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.additionalImagesError = "Every additional image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      this.newProduct.dodatneSlike.push(reader.result as string);
      input.value = "";
    };

    reader.onerror = () => {
      this.additionalImagesError = "Additional image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  removeAdditionalImage(imageIndex: number) {
    this.newProduct.dodatneSlike.splice(imageIndex, 1);
    this.additionalImagesError = "";
  }

  addProduct(productForm: NgForm, mainImageInput: HTMLInputElement, additionalImagesInput: HTMLInputElement) {
    this.message = "";

    if (productForm.invalid || this.mainImageError || this.additionalImagesError) {
      productForm.form.markAllAsTouched();
      return;
    }

    if (!this.newProduct.slikaUrl) {
      this.message = "Main product image is required.";
      return;
    }

    if (this.newProduct.uslugeStampe.length == 0) {
      this.message = "Add at least one printing service.";
      return;
    }

    if (this.loggedUser == null) return;

    this.productService.addProduct(this.loggedUser._id, this.newProduct).subscribe({
      next: data => {
        this.message = data.message;
        this.newProduct = new ProductModel();
        this.newProduct.dostupneBoje = ["Bela"];
        this.newPrintingService = new PrintingServiceModel();
        this.newColor = "";
        this.mainImageError = "";
        this.additionalImagesError = "";
        mainImageInput.value = "";
        additionalImagesInput.value = "";
        productForm.resetForm(this.newProduct);

        if (this.categories.length > 0) {
          this.newProduct.kategorija = this.categories[0].naziv;
          this.selectCategory();
        }

        this.loadProducts();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while adding the product.";
        }
      }
    });
  }

  updateQuantity(product: ProductModel) {
    if (this.loggedUser == null) return;

    if (!Number.isInteger(product.kolicinaNaLageru) || product.kolicinaNaLageru < 0) {
      this.message = "Stock quantity must be a non-negative integer.";
      return;
    }

    this.message = "";

    this.productService.updateProductQuantity(this.loggedUser._id, product._id, product.kolicinaNaLageru).subscribe({
      next: data => {
        this.message = data.message;
        this.loadProducts();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating product quantity.";
        }
      }
    });
  }

}
