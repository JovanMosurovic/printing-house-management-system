import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CartItemModel} from '../models/cart';
import {CreatePublicProcurementResponseModel, PublicProcurementModel, SubmitPublicProcurementOfferResponseModel} from '../models/public-procurement';

@Injectable({
  providedIn: 'root',
})
export class PublicProcurementService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:4000/api/public-procurements";

  createPublicProcurement(clientId: string, cartItems: CartItemModel[]) {
    const data = {clientId: clientId, items: cartItems};
    return this.http.post<CreatePublicProcurementResponseModel>(`${this.apiUrl}/create`, data);
  }

  getOpenPublicProcurements(printerId: string) {
    return this.http.get<PublicProcurementModel[]>(`${this.apiUrl}/printer/${printerId}`);
  }

  submitOffer(printerId: string, publicProcurementId: string) {
    const data = {printerId: printerId, publicProcurementId: publicProcurementId};
    return this.http.post<SubmitPublicProcurementOfferResponseModel>(`${this.apiUrl}/offer`, data);
  }

  getClientPublicProcurements(clientId: string) {
    return this.http.get<PublicProcurementModel[]>(`${this.apiUrl}/client/${clientId}`);
  }
}
