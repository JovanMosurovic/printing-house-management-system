import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {LoginModel} from '../models/login';
import {FormsModule, NgForm} from '@angular/forms';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  private userService = inject(UserService);

  loginAdmin = new LoginModel();
  message = "";

  login(adminLoginForm: NgForm) {
    this.message = "";

    if (adminLoginForm.invalid) {
      adminLoginForm.form.markAllAsTouched();
      return;
    }

    this.userService.adminLogin(this.loginAdmin).subscribe({
      next: data => {
        this.message = `Welcome administrator ${data.firstName} ${data.lastName}`;
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while logging in as administrator.";
        }
      }
    });
  }


}
