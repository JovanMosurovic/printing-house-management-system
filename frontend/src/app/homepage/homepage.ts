import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {LoginModel} from '../models/login';
import {Router, RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-homepage',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginUser = new LoginModel();
  message = "";

  login(loginForm: NgForm) {
    this.message = "";

    if (loginForm.invalid) {
      loginForm.form.markAllAsTouched();
      return;
    }

    this.userService.login(this.loginUser).subscribe({
      next: data => {
        this.authService.setLoggedUser(data);

        if (data.role == "printer") {
          this.router.navigate(["/printer"]);
        } else {
          this.router.navigate(["/client"]);
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while logging in.";
        }
      }
    });
  }
}
