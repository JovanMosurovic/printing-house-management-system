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

    this.userService.register(this.registerUser).subscribe(data => {
      alert(data.message);

      if (data.message === "User successfully added.") {
        this.registerUser = new RegisterModel()
        registerForm.resetForm(this.registerUser);
      }
    })
  }
}
