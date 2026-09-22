import {Injectable} from '@angular/core';
import {CartItemModel} from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  getCartItems(userId: string): CartItemModel[] {
    let cartItems = sessionStorage.getItem(this.getStorageKey(userId));
    return cartItems ? JSON.parse(cartItems) : [];
  }

  addToCart(userId: string, cartItem: CartItemModel) {
    let cartItems = this.getCartItems(userId);
    cartItems.push(cartItem);
    sessionStorage.setItem(this.getStorageKey(userId), JSON.stringify(cartItems));
  }

  clearCart(userId: string) {
    sessionStorage.removeItem(this.getStorageKey(userId));
  }

  private getStorageKey(userId: string) {
    return `cart_${userId}`;
  }
}
