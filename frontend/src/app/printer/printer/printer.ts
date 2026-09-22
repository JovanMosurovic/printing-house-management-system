import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {copyUser, UserModel} from '../../models/user';
import {InvoiceModel, InvoiceStatus} from '../../models/invoice';
import {InvoiceService} from '../../services/invoice.service';
import {DatePipe} from '@angular/common';
import {UserService} from '../../services/user.service';
import {FormsModule, NgForm} from '@angular/forms';

@Component({
  selector: 'app-printer',
  imports: [DatePipe, FormsModule],
  templateUrl: './printer.html',
  styleUrl: './printer.css',
})
export class Printer implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  profileUser: UserModel | null = null;
  originalProfileUser: UserModel | null = null;
  invoices: InvoiceModel[] = [];
  message = "";
  messageIsError = false;
  messageIsClosing = false;
  profileImageError = "";
  currentPassword = "";
  newPassword = "";
  confirmPassword = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null) {
      this.router.navigate([""]);
      return;
    }

    if (this.loggedUser.role != "printer") {
      this.router.navigate([""]);
      return;
    }

    this.profileUser = copyUser(this.loggedUser);

    this.loadProfile();
    this.loadInvoices();
  }

  loadProfile() {
    if (this.loggedUser == null) return;

    this.userService.getUserProfile(this.loggedUser._id).subscribe({
      next: data => {
        this.loggedUser = data;
        this.profileUser = copyUser(data);
        this.originalProfileUser = copyUser(data);
        this.authService.setLoggedUser(data);
      },
      error: error => {
        this.messageIsError = true;
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
    this.messageIsError = false;
    this.messageIsClosing = false;

    if (profileForm.invalid || this.profileImageError) {
      profileForm.form.markAllAsTouched();
      return;
    }

    if (this.passwordChangeRequested() && this.newPassword != this.confirmPassword) {
      this.message = "Passwords do not match.";
      this.messageIsError = true;
      return;
    }

    if (this.profileUser == null || !this.hasProfileChanges()) return;

    this.userService.updateUserProfile(this.profileUser, this.currentPassword, this.newPassword, this.confirmPassword).subscribe({
      next: data => {
        this.loggedUser = data;
        this.profileUser = copyUser(data);
        this.originalProfileUser = copyUser(data);
        this.currentPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
        this.authService.setLoggedUser(data);
        this.showTemporaryMessage("Profile was successfully updated.");
      },
      error: error => {
        this.messageIsError = true;
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

    if (!file || this.profileUser == null) return;

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
        if (image.width < 100 || image.height < 100 || image.width > 250 || image.height > 250) {
          this.profileImageError = "Profile image dimensions must be between 100x100 and 250x250 pixels.";
          input.value = "";
          return;
        }

        if (this.profileUser != null) this.profileUser.profileImage = profileImageBase64;
      };

      image.onerror = () => {
        this.profileImageError = "Profile image is not valid.";
        input.value = "";
      };

      image.src = profileImageBase64;
    };

    reader.onerror = () => {
      this.profileImageError = "Profile image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  loadInvoices() {
    if (this.loggedUser == null) return;

    this.invoiceService.getPrintingHouseInvoices(this.loggedUser._id).subscribe({
      next: data => {
        this.invoices = data;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading orders.";
        }
      }
    });
  }

  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    if (this.loggedUser == null) return;

    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;

    this.invoiceService.updateInvoiceStatus(this.loggedUser._id, invoiceId, status).subscribe({
      next: data => {
        this.showTemporaryMessage(data.message);
        this.loadInvoices();
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating the order status.";
        }
      }
    });
  }

  showTemporaryMessage(message: string) {
    this.messageIsClosing = false;
    this.message = message;
    setTimeout(() => {
      if (this.message == message) this.closeMessage();
    }, 3500);
  }

  closeMessage() {
    if (!this.message || this.messageIsClosing) return;

    let messageToClose = this.message;
    this.messageIsClosing = true;

    setTimeout(() => {
      if (this.message == messageToClose) this.message = "";
      this.messageIsClosing = false;
    }, 220);
  }

  hasProfileChanges() {
    if (this.profileUser == null || this.originalProfileUser == null) return false;
    return JSON.stringify(this.profileUser) != JSON.stringify(this.originalProfileUser) || this.passwordChangeRequested();
  }

  passwordChangeRequested() {
    return this.currentPassword != "" || this.newPassword != "" || this.confirmPassword != "";
  }

}
