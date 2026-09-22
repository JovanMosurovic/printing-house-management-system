import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CategoryModel, HomepageDataModel, ProductModel, ProductSearchModel} from '../models/product';
import {MessageModel} from '../models/message';
import {AdminStatisticsModel} from '../models/statistics';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:4000/api/products";

  getHomepageData() {
    return this.http.get<HomepageDataModel>(`${this.apiUrl}/homepage`);
  }

  getActiveCategories() {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getAllCategories() {
    return this.http.get<CategoryModel[]>(`${this.apiUrl}/all-categories`);
  }

  addCategory(categoryName: string) {
    const data = {categoryName: categoryName};
    return this.http.post<CategoryModel>(`${this.apiUrl}/admin/add-category`, data);
  }

  addSubcategory(categoryId: string, subcategoryName: string) {
    const data = {categoryId: categoryId, subcategoryName: subcategoryName};
    return this.http.post<CategoryModel>(`${this.apiUrl}/admin/add-subcategory`, data);
  }

  getAdminStatistics() {
    return this.http.get<AdminStatisticsModel>(`${this.apiUrl}/admin/statistics`);
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
    return this.http.get<ProductModel>(`${this.apiUrl}/${productId}`);
  }

  setReaction(clientId: string, productId: string, reaction: "like" | "dislike") {
    const data = {clientId: clientId, productId: productId, reaction: reaction};
    return this.http.post<MessageModel>(`${this.apiUrl}/reaction`, data);
  }

  addComment(clientId: string, productId: string, text: string) {
    const data = {clientId: clientId, productId: productId, text: text};
    return this.http.post<MessageModel>(`${this.apiUrl}/comment`, data);
  }

  getPrintingHouseProducts(printerId: string) {
    return this.http.get<ProductModel[]>(`${this.apiUrl}/printer/${printerId}`);
  }

  addProduct(printerId: string, product: ProductModel) {
    const data = {
      printerId: printerId,
      sifra: product.sifra,
      naziv: product.naziv,
      opis: product.opis,
      kategorija: product.kategorija,
      potkategorija: product.potkategorija,
      jedinicnaCena: product.jedinicnaCena,
      kolicinaNaLageru: product.kolicinaNaLageru,
      dostupneBoje: product.dostupneBoje,
      slikaUrl: product.slikaUrl,
      dodatneSlike: product.dodatneSlike,
      uslugeStampe: product.uslugeStampe
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/printer/add`, data);
  }

  updateProductQuantity(printerId: string, productId: string, quantity: number) {
    const data = {printerId: printerId, productId: productId, quantity: quantity};
    return this.http.post<MessageModel>(`${this.apiUrl}/printer/update-quantity`, data);
  }

  importProducts(printerId: string, products: ProductModel[]) {
    const data = {printerId: printerId, products: products};
    return this.http.post<MessageModel>(`${this.apiUrl}/printer/import`, data);
  }

}
