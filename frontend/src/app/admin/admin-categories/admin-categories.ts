import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {CategoryModel} from '../../models/product';
import {AuthService} from '../../services/auth.service';
import {ProductService} from '../../services/product.service';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  categories: CategoryModel[] = [];
  categoryName = "";
  selectedCategoryId = "";
  subcategoryName = "";
  message = "";
  messageIsError = false;

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser == null) {
      this.router.navigate(["/admin/login"]);
      return;
    }

    if (loggedUser.role != "admin") {
      this.router.navigate([""]);
      return;
    }

    this.loadCategories();
  }

  loadCategories() {
    this.productService.getAllCategories().subscribe({
      next: data => {
        this.categories = data;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading categories.";
        }
      }
    });
  }

  addCategory(categoryForm: NgForm) {
    this.message = "";
    this.messageIsError = false;

    if (categoryForm.invalid) {
      categoryForm.form.markAllAsTouched();
      return;
    }

    this.productService.addCategory(this.categoryName).subscribe({
      next: data => {
        this.message = `Category ${data.naziv} was successfully added.`;
        categoryForm.resetForm();
        this.loadCategories();
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while adding category.";
        }
      }
    });
  }

  addSubcategory(subcategoryForm: NgForm) {
    this.message = "";
    this.messageIsError = false;

    if (subcategoryForm.invalid) {
      subcategoryForm.form.markAllAsTouched();
      return;
    }

    this.productService.addSubcategory(this.selectedCategoryId, this.subcategoryName).subscribe({
      next: data => {
        this.message = `Subcategory ${this.subcategoryName} was successfully added to ${data.naziv}.`;
        subcategoryForm.resetForm();
        this.loadCategories();
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while adding subcategory.";
        }
      }
    });
  }

}
