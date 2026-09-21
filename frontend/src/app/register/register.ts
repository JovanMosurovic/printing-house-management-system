import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {RegisterModel} from '../models/register';
import {FormsModule, NgForm} from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private userService = inject(UserService);

  registerUser = new RegisterModel();

  register(registerForm: NgForm) {
    if (registerForm.invalid) {
      registerForm.form.markAllAsTouched();
      return;
    }

    this.userService.register(this.registerUser).subscribe({
      next: data => {
        alert(data.message);

        if (data.message === "User successfully added.") {
          this.registerUser = new RegisterModel();
          registerForm.resetForm(this.registerUser);
        }
      },
      error: error => {
        if (error.error?.message) {
          alert(error.error.message);
        } else {
          alert("Unexpected error while registering.");
        }
      }
    });
  }

}
