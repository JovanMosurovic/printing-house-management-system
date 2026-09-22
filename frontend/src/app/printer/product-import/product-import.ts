import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {ProductService} from '../../services/product.service';
import {UserModel} from '../../models/user';
import {PrintingServiceModel, ProductImportFileModel, ProductModel} from '../../models/product';

@Component({
  selector: 'app-product-import',
  imports: [RouterLink],
  templateUrl: './product-import.html',
  styleUrl: './product-import.css',
})
export class ProductImport implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  importedProducts: ProductModel[] = [];
  imageErrors: string[] = [];
  selectedFileName = "";
  message = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || this.loggedUser.role != "printer") {
      this.router.navigate([""]);
    }
  }

  selectJsonFile(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.message = "";
    this.selectedFileName = "";
    this.importedProducts = [];
    this.imageErrors = [];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      this.message = "Please select a JSON file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      try {
        let importedData: ProductImportFileModel = JSON.parse(reader.result as string);

        if (!Array.isArray(importedData.proizvodi) || importedData.proizvodi.length == 0) {
          this.message = "The JSON file must contain a non-empty proizvodi array.";
          input.value = "";
          return;
        }

        for (let importedProduct of importedData.proizvodi) {
          let product = new ProductModel();
          product.sifra = importedProduct.sifra;
          product.naziv = importedProduct.naziv;
          product.opis = importedProduct.opis;
          product.kategorija = importedProduct.kategorija;
          product.potkategorija = importedProduct.potkategorija;
          product.jedinicnaCena = importedProduct.jedinicnaCena;
          product.kolicinaNaLageru = importedProduct.kolicinaNaLageru;
          product.dostupneBoje = [];
          product.slikaUrl = "";
          product.dodatneSlike = [];
          product.uslugeStampe = [];

          if (Array.isArray(importedProduct.dostupneBoje)) {
            for (let color of importedProduct.dostupneBoje) product.dostupneBoje.push(color);
          }

          if (Array.isArray(importedProduct.uslugeStampe)) {
            for (let importedService of importedProduct.uslugeStampe) {
              let printingService = new PrintingServiceModel();
              printingService.idUsluge = importedService.idUsluge;
              printingService.tipStampe = importedService.tipStampe;
              printingService.dodatnaCenaPoKomadu = importedService.dodatnaCenaPoKomadu;
              printingService.maxSirinaMm = importedService.maxSirinaMm;
              printingService.maxVisinaMm = importedService.maxVisinaMm;
              product.uslugeStampe.push(printingService);
            }
          }

          this.importedProducts.push(product);
          this.imageErrors.push("");
        }

        this.selectedFileName = file.name;
      } catch {
        this.message = "The selected file does not contain valid JSON.";
        input.value = "";
      }
    };

    reader.onerror = () => {
      this.message = "The JSON file could not be read.";
      input.value = "";
    };

    reader.readAsText(file);
  }

  selectMainImage(product: ProductModel, productIndex: number, input: HTMLInputElement) {
    let file = input.files?.[0];

    this.imageErrors[productIndex] = "";
    product.slikaUrl = "";

    if (!file) return;

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.imageErrors[productIndex] = "Main image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      product.slikaUrl = reader.result as string;
      input.value = "";
    };

    reader.onerror = () => {
      this.imageErrors[productIndex] = "Main image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  selectAdditionalImage(product: ProductModel, productIndex: number, input: HTMLInputElement) {
    let file = input.files?.[0];

    this.imageErrors[productIndex] = "";

    if (!file) return;

    if (product.dodatneSlike.length >= 3) {
      this.imageErrors[productIndex] = "A product can have at most three additional images.";
      input.value = "";
      return;
    }

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.imageErrors[productIndex] = "Additional image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      product.dodatneSlike.push(reader.result as string);
      input.value = "";
    };

    reader.onerror = () => {
      this.imageErrors[productIndex] = "Additional image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  removeAdditionalImage(product: ProductModel, productIndex: number, imageIndex: number) {
    product.dodatneSlike.splice(imageIndex, 1);
    this.imageErrors[productIndex] = "";
  }

  importProducts(jsonFileInput: HTMLInputElement) {
    if (this.loggedUser == null || this.importedProducts.length == 0) return;

    this.message = "";

    for (let i = 0; i < this.importedProducts.length; i++) {
      if (!this.importedProducts[i].slikaUrl) {
        this.message = `Add a main image for product ${this.importedProducts[i].naziv}.`;
        return;
      }

      if (this.imageErrors[i]) {
        this.message = "Correct the product image errors before importing.";
        return;
      }
    }

    this.productService.importProducts(this.loggedUser._id, this.importedProducts).subscribe({
      next: data => {
        this.message = data.message;
        this.importedProducts = [];
        this.imageErrors = [];
        this.selectedFileName = "";
        jsonFileInput.value = "";
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while importing products.";
        }
      }
    });
  }

}
