import {Component, inject} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ForgotPasswordModel} from '../../models/forgot-password';
import {FormsModule, NgForm} from '@angular/forms';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private userService = inject(UserService);

  forgotPasswordData = new ForgotPasswordModel();
  message = "";
  messageIsError = false;

  sendResetLink(forgotPasswordForm: NgForm) {
    this.message = "";
    this.messageIsError = false;

    if (forgotPasswordForm.invalid) {
      forgotPasswordForm.form.markAllAsTouched();
      return;
    }

    this.userService.forgotPassword(this.forgotPasswordData).subscribe({
      next: data => {
        this.message = data.message;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while requesting password reset.";
        }
      }
    });
  }
}
