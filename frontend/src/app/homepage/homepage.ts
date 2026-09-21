import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {LoginModel} from '../models/login';
import {RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';

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
        this.message = `Welcome ${data.firstName} ${data.lastName}`;
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
