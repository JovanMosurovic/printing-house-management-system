import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {ProductModel, ProductSearchModel} from '../models/product';
import {AuthService} from '../services/auth.service';
import {ProductService} from '../services/product.service';

@Component({
  selector: 'app-client-products',
  imports: [FormsModule, RouterLink],
  templateUrl: './client-products.html',
  styleUrl: './client-products.css',
})
export class ClientProducts implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  categories: string[] = [];
  productSearch = new ProductSearchModel();
  products: ProductModel[] = [];
  message = "";

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser == null || (loggedUser.role != "individualClient" && loggedUser.role != "businessClient")) {
      this.router.navigate([""]);
      return;
    }

    this.loadCategories();
    this.searchProducts();
  }

  loadCategories() {
    this.productService.getActiveCategories().subscribe({
      next: data => {
        this.categories = data;
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

  searchProducts() {
    this.message = "";

    this.productService.searchProducts(this.productSearch).subscribe({
      next: data => {
        this.products = data;
        if (this.products.length === 0) this.message = "No products were found.";
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while searching products.";
        }
      }
    });
  }

  changeSortDirection() {
    if (this.productSearch.sortDirection == "asc") {
      this.productSearch.sortDirection = "desc";
    } else {
      this.productSearch.sortDirection = "asc";
    }

    this.searchProducts();
  }

  openProductDetails(productId: string) {
    this.router.navigate(["/product", productId]);
  }
}
