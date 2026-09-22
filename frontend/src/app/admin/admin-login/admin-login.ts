import {Component, inject} from '@angular/core';
import {UserService} from '../../services/user.service';
import {LoginModel} from '../../models/login';
import {FormsModule, NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router)

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
        this.authService.setLoggedUser(data);
        this.router.navigate(["/admin"]);
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
