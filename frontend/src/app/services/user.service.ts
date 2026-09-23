import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {UserModel} from '../models/user';
import {LoginModel} from '../models/login';
import {RegisterModel} from '../models/register';
import {MessageModel} from '../models/message';
import {ForgotPasswordModel} from '../models/forgot-password';
import {ResetPasswordModel} from '../models/reset-password';

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

  getAllUsers() {
    return this.http.get<UserModel[]>(`${this.apiUrl}/admin/all`);
  }

  adminUpdateUser(user: UserModel) {
    const institution = user.role === "individualClient" ? undefined : {
      name: user.institution?.name || "",
      address: user.institution?.address || "",
      city: user.institution?.city || "",
      registrationNumber: user.institution?.registrationNumber || "",
      taxId: user.institution?.taxId || ""
    };

    const data = {
      userId: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      status: user.status,
      institution: institution
    };

    return this.http.post<UserModel>(`${this.apiUrl}/admin/update-user`, data);
  }

  deleteUser(userId: string) {
    const data = {userId: userId};
    return this.http.post<MessageModel>(`${this.apiUrl}/admin/delete-user`, data);
  }

  register(registerUser: RegisterModel) {
    const institution =
      registerUser.role === "individualClient" ? undefined :
        {
          name: registerUser.institution.name,
          address: registerUser.institution.address,
          city: registerUser.institution.city,
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
      profileImage: registerUser.profileImage,
      role: registerUser.role,
      institution: institution
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/register`, data);
  }

  forgotPassword(forgotPasswordData: ForgotPasswordModel) {
    const data = {
      usernameOrEmail: forgotPasswordData.usernameOrEmail
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(resetPasswordData: ResetPasswordModel) {
    const data = {
      token: resetPasswordData.token,
      newPassword: resetPasswordData.newPassword,
      confirmPassword: resetPasswordData.confirmPassword
    };

    return this.http.post<MessageModel>(`${this.apiUrl}/reset-password`, data);
  }

  getUserProfile(userId: string) {
    return this.http.get<UserModel>(`${this.apiUrl}/profile/${userId}`);
  }

  updateUserProfile(user: UserModel, currentPassword = "", newPassword = "", confirmPassword = "") {
    const institution =
      user.role === "individualClient" ? undefined :
        {
          name: user.institution?.name || "",
          address: user.institution?.address || "",
          city: user.institution?.city || "",
          registrationNumber:
            user.institution?.registrationNumber || "",
          taxId: user.institution?.taxId || ""
        };

    const data = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      institution: institution,
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    };

    return this.http.post<UserModel>(`${this.apiUrl}/profile/update`, data);
  }
}
