import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {CartItemModel} from '../../models/cart';
import {PaymentModel} from '../../models/payment';
import {UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {CartService} from '../../services/cart.service';
import {InvoiceService} from '../../services/invoice.service';

@Component({
  selector: 'app-payment',
  imports: [FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  cartItems: CartItemModel[] = [];
  payment = new PaymentModel();
  totalPrice = 0;
  message = "";
  messageIsError = false;
  isPaying = false;
  paymentCompleted = false;

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || this.loggedUser.role != "individualClient") {
      this.router.navigate([""]);
      return;
    }

    this.cartItems = this.cartService.getCartItems(this.loggedUser._id);

    for (let cartItem of this.cartItems) this.totalPrice += cartItem.totalPrice;

    if (this.cartItems.length == 0) {
      this.message = "The shopping cart is empty.";
      this.messageIsError = true;
    }
  }

  pay(paymentForm: NgForm) {
    this.message = "";
    this.messageIsError = false;

    if (paymentForm.invalid) {
      paymentForm.form.markAllAsTouched();
      return;
    }

    if (this.loggedUser == null || this.cartItems.length == 0) return;

    this.isPaying = true;

    this.invoiceService.confirmOrder(this.loggedUser._id, this.cartItems, this.payment).subscribe({
      next: data => {
        this.cartService.clearCart(this.loggedUser!._id);
        this.message = data.message;
        this.paymentCompleted = true;
        this.isPaying = false;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while processing the simulated payment.";
        }

        this.isPaying = false;
      }
    });
  }

  backToCart() {
    this.router.navigate(["/client/cart"]);
  }

  openProfile() {
    this.router.navigate(["/client"]);
  }

}
