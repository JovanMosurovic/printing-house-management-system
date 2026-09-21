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
  message = "";
  profileImageError = "";

  register(registerForm: NgForm, profileImageInput: HTMLInputElement) {
    this.message = "";

    if (registerForm.invalid || this.profileImageError) {
      registerForm.form.markAllAsTouched();
      return;
    }

    this.userService.register(this.registerUser).subscribe({
      next: data => {
        this.message = data.message;

        if (data.message === "User successfully added.") {
          this.registerUser = new RegisterModel();
          this.profileImageError = "";
          profileImageInput.value = "";
          registerForm.resetForm(this.registerUser);
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while registering.";
        }
      }
    });
  }

  selectProfileImage(input: HTMLInputElement) {
    const file = input.files?.[0];

    this.profileImageError = "";
    this.registerUser.profileImage = null;

    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/gif") {
      this.profileImageError = "Profile image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    this.registerUser.profileImage = file;

    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      if (image.width < 100 || image.height < 100 || image.width > 250 || image.height > 250) {
        this.profileImageError = "Profile image dimensions must be between 100x100 and 250x250 pixels.";
        this.registerUser.profileImage = null;
        input.value = "";
      }

      URL.revokeObjectURL(imageUrl);
    };

    image.onerror = () => {
      this.profileImageError = "Profile image is not valid.";
      this.registerUser.profileImage = null;
      input.value = "";
      URL.revokeObjectURL(imageUrl);
    };

    image.src = imageUrl;
  }

}
