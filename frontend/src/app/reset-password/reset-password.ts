import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {FormsModule, NgForm} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ResetPasswordModel} from '../models/reset-password';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private userService = inject(UserService);
  private activatedRoute = inject(ActivatedRoute);

  resetPasswordData = new ResetPasswordModel();
  message = "";

  constructor() {
    this.resetPasswordData.token = this.activatedRoute.snapshot.paramMap.get("token") || "";
  }

  resetPassword(resetPasswordForm: NgForm) {
    this.message = "";

    if (resetPasswordForm.invalid) {
      resetPasswordForm.form.markAllAsTouched();
      return;
    }

    if (this.resetPasswordData.newPassword != this.resetPasswordData.confirmPassword) {
      this.message = "Passwords do not match.";
      return;
    }

    this.userService.resetPassword(this.resetPasswordData).subscribe({
      next: data => {
        this.message = data.message;
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while resetting password.";
        }
      }
    });
  }
}
