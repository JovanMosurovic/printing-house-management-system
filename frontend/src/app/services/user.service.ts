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

    return this.http.post<UserModel | null>(`${this.apiUrl}/login`, data);
  }

  register(registerUser: RegisterModel) {
    const institution =
      registerUser.role === "individualClient" ? undefined :
        {
          name: registerUser.institution.name,
          address: registerUser.institution.address,
          registrationNumber: registerUser.institution.registrationNumber,
          taxId: registerUser.institution.taxId
        };

    const data = {
      username: registerUser.username,
      password: registerUser.password,
      firstName: registerUser.firstName,
      lastName: registerUser.lastName,
      phone: registerUser.phone,
      email: registerUser.email,
      role: registerUser.role,
      institution: institution
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/register`, data);
  }
}
