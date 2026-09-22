import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {UserModel} from '../models/user';
import {InvoiceModel, InvoiceStatus} from '../models/invoice';
import {InvoiceService} from '../services/invoice.service';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-printer',
  imports: [DatePipe, RouterLink],
  templateUrl: './printer.html',
  styleUrl: './printer.css',
})
export class Printer implements OnInit {
  private authService = inject(AuthService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  invoices: InvoiceModel[] = [];
  message = "";

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

    this.loadInvoices();
  }

  loadInvoices() {
    if (this.loggedUser == null) return;

    this.invoiceService.getPrintingHouseInvoices(this.loggedUser._id).subscribe({
      next: data => {
        this.invoices = data;
      },
      error: error => {
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

    this.invoiceService.updateInvoiceStatus(this.loggedUser._id, invoiceId, status).subscribe({
      next: data => {
        this.message = data.message;
        this.loadInvoices();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating the order status.";
        }
      }
    });
  }

}
