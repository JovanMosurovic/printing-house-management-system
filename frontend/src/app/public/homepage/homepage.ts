import {Component, inject, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {LoginModel} from '../../models/login';
import {Router, RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {ProductService} from '../../services/product.service';
import {HomepageDataModel, ProductModel, ProductSearchModel} from '../../models/product';

@Component({
  selector: 'app-homepage',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage implements OnInit {
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginUser = new LoginModel();
  message = "";

  homepageData = new HomepageDataModel();
  productSearch = new ProductSearchModel();
  products: ProductModel[] = [];
  productMessage = "";

  ngOnInit() {
    this.loadHomepageData();
    this.searchProducts();
  }

  loadHomepageData() {
    this.productService.getHomepageData().subscribe({
      next: data => {
        this.homepageData = data;
      },
      error: error => {
        if (error.error?.message) {
          this.productMessage = error.error.message;
        } else {
          this.productMessage = "Unexpected error while loading homepage data.";
        }
      }
    });
  }

  searchProducts() {
    this.productMessage = "";

    this.productService.searchProducts(this.productSearch).subscribe({
      next: data => {
        this.products = data;

        if (this.products.length === 0) {
          this.productMessage = "No products were found.";
        }
      },
      error: error => {
        if (error.error?.message) {
          this.productMessage = error.error.message;
        } else {
          this.productMessage = "Unexpected error while searching products.";
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

  login(loginForm: NgForm) {
    this.message = "";

    if (loginForm.invalid) {
      loginForm.form.markAllAsTouched();
      return;
    }

    this.userService.login(this.loginUser).subscribe({
      next: data => {
        this.authService.setLoggedUser(data);

        if (data.role == "printer") {
          this.router.navigate(["/printer"]);
        } else {
          this.router.navigate(["/client"]);
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while logging in.";
        }
      }
    });
  }
}
