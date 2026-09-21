import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {UserModel} from '../models/user';
import {LoginModel} from '../models/login';
import {RegisterModel} from '../models/register';
import {MessageModel} from '../models/message';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient)
  private apiUrl = "http://localhost:4000/api/users";

  login(loginUser: LoginModel) {
    const data = {
      username: loginUser.username,
      password: loginUser.password,
    };

    return this.http.post<UserModel>(`${this.apiUrl}/login`, data);
  }

  adminLogin(loginAdmin: LoginModel) {
    const data = {
      username: loginAdmin.username,
      password: loginAdmin.password
    };

    return this.http.post<UserModel>(`${this.apiUrl}/admin/login`, data);
  }

  getPendingUsers() {
    return this.http.get<UserModel[]>(`${this.apiUrl}/admin/pending`);
  }

  updateUserStatus(userId: string, status: "approved" | "rejected") {
    const data = {
      userId: userId,
      status: status
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/admin/update-user-status`, data);
  }

  register(registerUser: RegisterModel) {
    const data = new FormData();

    data.append("username", registerUser.username);
    data.append("password", registerUser.password);
    data.append("firstName", registerUser.firstName);
    data.append("lastName", registerUser.lastName);
    data.append("phone", registerUser.phone);
    data.append("email", registerUser.email);
    data.append("role", registerUser.role);

    if (registerUser.role === "businessClient" || registerUser.role === "printer") {
      const institution = {
        name: registerUser.institution.name,
        address: registerUser.institution.address,
        registrationNumber: registerUser.institution.registrationNumber,
        taxId: registerUser.institution.taxId
      };

      data.append("institution", JSON.stringify(institution));
    }

    if (registerUser.profileImage) {
      data.append("profileImage", registerUser.profileImage);
    }

    return this.http.post<MessageModel>(`${this.apiUrl}/register`, data);
  }
}
