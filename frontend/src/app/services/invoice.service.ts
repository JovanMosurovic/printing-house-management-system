import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CartItemModel} from '../models/cart';
import {ConfirmOrderResponseModel, InvoiceModel, InvoiceStatus} from '../models/invoice';
import {MessageModel} from '../models/message';

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

  getClientInvoices(clientId: string) {
    return this.http.get<InvoiceModel[]>(`${this.apiUrl}/client/${clientId}`);
  }

  cancelInvoice(clientId: string, invoiceId: string) {
    const data = {clientId: clientId, invoiceId: invoiceId};
    return this.http.post<MessageModel>(`${this.apiUrl}/cancel`, data);
  }

  getPrintingHouseInvoices(printerId: string) {
    return this.http.get<InvoiceModel[]>(`${this.apiUrl}/printer/${printerId}`);
  }

  updateInvoiceStatus(printerId: string, invoiceId: string, status: InvoiceStatus) {
    const data = {printerId: printerId, invoiceId: invoiceId, status: status};
    return this.http.post<MessageModel>(`${this.apiUrl}/printer/update-status`, data);
  }
}
