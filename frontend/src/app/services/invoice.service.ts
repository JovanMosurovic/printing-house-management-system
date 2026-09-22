import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CartItemModel} from '../models/cart';
import {ConfirmOrderResponseModel} from '../models/invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:4000/api/invoices";

  confirmOrder(clientId: string, cartItems: CartItemModel[]) {
    const data = {clientId: clientId, items: cartItems};
    return this.http.post<ConfirmOrderResponseModel>(`${this.apiUrl}/confirm`, data);
  }
}
