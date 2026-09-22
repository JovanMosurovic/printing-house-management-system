import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {HomepageDataModel, ProductModel, ProductSearchModel, PublicProductDetailsModel} from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:4000/api/products";

  getHomepageData() {
    return this.http.get<HomepageDataModel>(`${this.apiUrl}/homepage`);
  }

  searchProducts(productSearch: ProductSearchModel) {
    const data = {
      naziv: productSearch.naziv,
      kategorija: productSearch.kategorija,
      sortDirection: productSearch.sortDirection
    };

    return this.http.post<ProductModel[]>(`${this.apiUrl}/search`, data);
  }

  getProductDetails(productId: string) {
    return this.http.get<PublicProductDetailsModel>(`${this.apiUrl}/${productId}`);
  }

}
