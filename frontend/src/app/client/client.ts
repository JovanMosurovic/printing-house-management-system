import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {UserModel} from '../models/user';
import {UserService} from '../services/user.service';
import {FormsModule, NgForm} from '@angular/forms';
import {InvoiceModel, InvoiceSortField} from '../models/invoice';
import {InvoiceService} from '../services/invoice.service';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-client',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class Client implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  message = "";

  profileImageError = "";

  invoices: InvoiceModel[] = [];
  invoiceMessage = "";
  invoiceSortField: InvoiceSortField = "createdAt";
  invoiceSortDirection: "asc" | "desc" = "desc";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null) {
      this.router.navigate([""]);
      return;
    }

    if (this.loggedUser.role != "individualClient" &&
      this.loggedUser.role != "businessClient") {
      this.router.navigate([""]);
      return;
    }

    this.loadProfile();
    this.loadInvoices();
  }

  loadInvoices() {
    if (this.loggedUser == null) return;

    this.invoiceService.getClientInvoices(this.loggedUser._id).subscribe({
      next: data => {
        this.invoices = data;
        this.applyInvoiceSorting();
      },
      error: error => {
        if (error.error?.message) {
          this.invoiceMessage = error.error.message;
        } else {
          this.invoiceMessage = "Unexpected error while loading orders.";
        }
      }
    });
  }

  sortInvoices(sortField: InvoiceSortField) {
    if (this.invoiceSortField == sortField) {
      this.invoiceSortDirection = this.invoiceSortDirection == "asc" ? "desc" : "asc";
    } else {
      this.invoiceSortField = sortField;
      this.invoiceSortDirection = "asc";
    }

    this.applyInvoiceSorting();
  }

  applyInvoiceSorting() {
    this.invoices.sort((firstInvoice, secondInvoice) => {
      let comparison = 0;

      if (this.invoiceSortField == "invoiceId") comparison = firstInvoice._id.localeCompare(secondInvoice._id);
      if (this.invoiceSortField == "printingHouseName") comparison = firstInvoice.printingHouseName.localeCompare(secondInvoice.printingHouseName, "sr");
      if (this.invoiceSortField == "printingHouseCity") comparison = firstInvoice.printingHouseCity.localeCompare(secondInvoice.printingHouseCity, "sr");
      if (this.invoiceSortField == "totalPrice") comparison = firstInvoice.totalPrice - secondInvoice.totalPrice;
      if (this.invoiceSortField == "status") comparison = firstInvoice.status.localeCompare(secondInvoice.status);
      if (this.invoiceSortField == "createdAt") comparison = new Date(firstInvoice.createdAt).getTime() - new Date(secondInvoice.createdAt).getTime();

      return this.invoiceSortDirection == "asc" ? comparison : -comparison;
    });
  }

  getInvoiceSortSymbol(sortField: InvoiceSortField) {
    if (this.invoiceSortField != sortField) return "";
    return this.invoiceSortDirection == "asc" ? "▲" : "▼";
  }

  cancelInvoice(invoiceId: string) {
    if (this.loggedUser == null) return;

    this.invoiceMessage = "";

    this.invoiceService.cancelInvoice(this.loggedUser._id, invoiceId).subscribe({
      next: data => {
        this.invoiceMessage = data.message;
        this.loadInvoices();
      },
      error: error => {
        if (error.error?.message) {
          this.invoiceMessage = error.error.message;
        } else {
          this.invoiceMessage = "Unexpected error while cancelling the order.";
        }
      }
    });
  }

  loadProfile() {
    if (this.loggedUser == null) return;

    this.userService.getUserProfile(this.loggedUser._id).subscribe({
      next: data => {
        this.loggedUser = data;
        this.authService.setLoggedUser(data);
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading profile.";
        }
      }
    });
  }

  updateProfile(profileForm: NgForm) {
    this.message = "";

    if (profileForm.invalid || this.profileImageError) {
      profileForm.form.markAllAsTouched();
      return;
    }

    if (this.loggedUser == null) return;

    this.userService.updateUserProfile(this.loggedUser).subscribe({
      next: data => {
        this.loggedUser = data;
        this.authService.setLoggedUser(data);
        this.message = "Profile was successfully updated.";
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating profile.";
        }
      }
    });
  }

  selectProfileImage(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.profileImageError = "";

    if (!file || this.loggedUser == null) return;

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.profileImageError = "Profile image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      let profileImageBase64 = reader.result as string;
      let image = new Image();

      image.onload = () => {
        if (image.width < 100 ||
          image.height < 100 ||
          image.width > 250 ||
          image.height > 250) {
          this.profileImageError = "Profile image dimensions must be between 100x100 and 250x250 pixels.";
          input.value = "";
          return;
        }

        if (this.loggedUser != null) {
          this.loggedUser.profileImage = profileImageBase64;
        }
      };

      image.onerror = () => {
        this.profileImageError = "Profile image is not valid.";
        input.value = "";
      };

      image.src = profileImageBase64;
    };

    reader.onerror = () => {
      this.profileImageError =
        "Profile image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

}
