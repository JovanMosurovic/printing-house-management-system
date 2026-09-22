import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {ArchivedProductModel, ProductArchiveSortField} from '../../models/invoice';
import {UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {InvoiceService} from '../../services/invoice.service';
import {ProductService} from '../../services/product.service';

@Component({
  selector: 'app-product-archive',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './product-archive.html',
  styleUrl: './product-archive.css',
})
export class ProductArchive implements OnInit {
  private authService = inject(AuthService);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  archivedProducts: ArchivedProductModel[] = [];
  sortField: ProductArchiveSortField = "orderDate";
  sortDirection: "asc" | "desc" = "desc";
  message = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || (this.loggedUser.role != "individualClient" && this.loggedUser.role != "businessClient")) {
      this.router.navigate([""]);
      return;
    }

    this.loadArchive();
  }

  loadArchive() {
    if (this.loggedUser == null) return;

    this.invoiceService.getProductArchive(this.loggedUser._id).subscribe({
      next: data => {
        this.archivedProducts = data;
        this.applySorting();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading the product archive.";
        }
      }
    });
  }

  sortProducts(sortField: ProductArchiveSortField) {
    if (this.sortField == sortField) {
      this.sortDirection = this.sortDirection == "asc" ? "desc" : "asc";
    } else {
      this.sortField = sortField;
      this.sortDirection = "asc";
    }

    this.applySorting();
  }

  applySorting() {
    this.archivedProducts.sort((firstProduct, secondProduct) => {
      let comparison = 0;

      if (this.sortField == "productName") comparison = firstProduct.productName.localeCompare(secondProduct.productName, "sr");
      if (this.sortField == "quantity") comparison = firstProduct.quantity - secondProduct.quantity;
      if (this.sortField == "printingHouseName") comparison = firstProduct.printingHouseName.localeCompare(secondProduct.printingHouseName, "sr");
      if (this.sortField == "orderDate") comparison = new Date(firstProduct.orderDate).getTime() - new Date(secondProduct.orderDate).getTime();

      return this.sortDirection == "asc" ? comparison : -comparison;
    });
  }

  getSortSymbol(sortField: ProductArchiveSortField) {
    if (this.sortField != sortField) return "";
    return this.sortDirection == "asc" ? "▲" : "▼";
  }

  showMarkAsReceivedButton(invoiceId: string, productIndex: number) {
    for (let i = 0; i < productIndex; i++) {
      if (this.archivedProducts[i].invoiceId == invoiceId) return false;
    }

    return true;
  }

  markAsReceived(invoiceId: string) {
    if (this.loggedUser == null) return;

    this.message = "";

    this.invoiceService.markAsReceived(this.loggedUser._id, invoiceId).subscribe({
      next: data => {
        this.message = data.message;
        this.loadArchive();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while confirming product receipt.";
        }
      }
    });
  }

  setReaction(productId: string, reaction: "like" | "dislike") {
    if (this.loggedUser == null) return;

    this.message = "";

    this.productService.setReaction(this.loggedUser._id, productId, reaction).subscribe({
      next: data => {
        this.message = data.message;
        this.loadArchive();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while saving the reaction.";
        }
      }
    });
  }

  addComment(product: ArchivedProductModel) {
    if (this.loggedUser == null) return;

    let commentText = product.commentText?.trim() || "";

    if (!commentText) {
      this.message = "Comment text is required.";
      return;
    }

    this.message = "";

    this.productService.addComment(this.loggedUser._id, product.productId, commentText).subscribe({
      next: data => {
        this.message = data.message;
        product.commentText = "";
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while adding the comment.";
        }
      }
    });
  }

}
