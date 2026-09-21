import { Injectable } from '@angular/core';
import {UserModel} from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storageKey = "loggedUser";

  setLoggedUser(user: UserModel) {
    sessionStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getLoggedUser(): UserModel | null {
    let user = sessionStorage.getItem(this.storageKey);

    return user ? JSON.parse(user) : null;
  }

  isAdmin() {
    return this.getLoggedUser()?.role == "admin";
  }

  logout() {
    sessionStorage.removeItem(this.storageKey);
  }
}
