import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {PrintingHouseCartModel} from '../../models/cart';
import {UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {CartService} from '../../services/cart.service';
import {InvoiceService} from '../../services/invoice.service';
import {PublicProcurementService} from '../../services/public-procurement.service';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private invoiceService = inject(InvoiceService);
  private publicProcurementService = inject(PublicProcurementService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  printingHouseCarts: PrintingHouseCartModel[] = [];
  totalPrice = 0;
  message = "";
  messageIsError = false;
  isConfirming = false;

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null ||
      (this.loggedUser.role != "individualClient" && this.loggedUser.role != "businessClient")) {
      this.router.navigate([""]);
      return;
    }

    this.loadCart();
  }

  loadCart() {
    if (this.loggedUser == null) return;

    let cartItems = this.cartService.getCartItems(this.loggedUser._id);
    this.printingHouseCarts = [];
    this.totalPrice = 0;

    for (let cartItem of cartItems) {
      let printingHouseCart: PrintingHouseCartModel | null = null;

      for (let currentPrintingHouseCart of this.printingHouseCarts) {
        if (currentPrintingHouseCart.printingHouseId == cartItem.printingHouseId) {
          printingHouseCart = currentPrintingHouseCart;
        }
      }

      if (printingHouseCart == null) {
        printingHouseCart = new PrintingHouseCartModel();
        printingHouseCart.printingHouseId = cartItem.printingHouseId;
        printingHouseCart.printingHouseName = cartItem.printingHouseName;
        this.printingHouseCarts.push(printingHouseCart);
      }

      printingHouseCart.items.push(cartItem);
      printingHouseCart.totalPrice += cartItem.totalPrice;
      this.totalPrice += cartItem.totalPrice;
    }
  }

  confirmOrder() {
    this.message = "";
    this.messageIsError = false;

    if (this.loggedUser == null) return;

    if (this.loggedUser.role != "individualClient") {
      this.message = "Business client orders must be created through public procurement.";
      this.messageIsError = true;
      return;
    }

    let cartItems = this.cartService.getCartItems(this.loggedUser._id);

    if (cartItems.length == 0) {
      this.message = "The shopping cart is empty.";
      this.messageIsError = true;
      return;
    }

    this.isConfirming = true;

    this.invoiceService.confirmOrder(this.loggedUser._id, cartItems).subscribe({
      next: data => {
        this.cartService.clearCart(this.loggedUser!._id);
        this.loadCart();
        this.message = data.message;
        this.isConfirming = false;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while confirming the order.";
        }

        this.isConfirming = false;
      }
    });
  }

  createPublicProcurement() {
    this.message = "";
    this.messageIsError = false;

    if (this.loggedUser == null) return;

    if (this.loggedUser.role != "businessClient") {
      this.message = "Only a business client can create a public procurement.";
      this.messageIsError = true;
      return;
    }

    let cartItems = this.cartService.getCartItems(this.loggedUser._id);

    if (cartItems.length == 0) {
      this.message = "The shopping cart is empty.";
      this.messageIsError = true;
      return;
    }

    this.isConfirming = true;

    this.publicProcurementService.createPublicProcurement(this.loggedUser._id, cartItems).subscribe({
      next: data => {
        this.cartService.clearCart(this.loggedUser!._id);
        this.loadCart();
        this.message = data.message;
        this.isConfirming = false;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while creating public procurement.";
        }

        this.isConfirming = false;
      }
    });
  }
}
