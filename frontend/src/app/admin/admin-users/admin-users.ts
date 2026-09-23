import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {copyUser, UserModel, UserRole} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  users: UserModel[] = [];
  editingUser: UserModel | null = null;
  originalUser: UserModel | null = null;
  userToDelete: UserModel | null = null;
  message = "";
  messageIsError = false;
  messageIsClosing = false;
  profileImageError = "";

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser == null) {
      this.router.navigate(["/admin/login"]);
      return;
    }

    if (loggedUser.role != "admin") {
      this.router.navigate([""]);
      return;
    }

    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: data => {
        this.users = data;
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading users.";
        }
      }
    });
  }

  editUser(user: UserModel) {
    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;
    this.profileImageError = "";
    this.userToDelete = null;
    this.originalUser = copyUser(user);
    this.editingUser = copyUser(user);
  }

  cancelEditing() {
    this.editingUser = null;
    this.originalUser = null;
    this.profileImageError = "";
  }

  saveUser(userForm: NgForm) {
    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;

    if (userForm.invalid || this.profileImageError) {
      userForm.form.markAllAsTouched();
      return;
    }

    if (this.editingUser == null || !this.hasUserChanges()) return;

    this.userService.adminUpdateUser(this.editingUser).subscribe({
      next: data => {
        this.showTemporaryMessage(`User ${data.username} was successfully updated.`);
        this.editingUser = null;
        this.originalUser = null;
        this.loadUsers();
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating user.";
        }
      }
    });
  }

  selectProfileImage(input: HTMLInputElement) {
    let file = input.files?.[0];

    this.profileImageError = "";

    if (!file || this.editingUser == null) return;

    if (file.type != "image/jpeg" && file.type != "image/png" && file.type != "image/gif") {
      this.profileImageError = "Profile image must be a JPG, PNG or GIF file.";
      input.value = "";
      return;
    }

    let reader = new FileReader();

    reader.onload = () => {
      let profileImageBase64 = reader.result as string;
      let image = new Image();

      image.onload = () => {
        if (image.width < 100 || image.height < 100 || image.width > 250 || image.height > 250) {
          this.profileImageError = "Profile image dimensions must be between 100x100 and 250x250 pixels.";
          input.value = "";
          return;
        }

        if (this.editingUser != null) this.editingUser.profileImage = profileImageBase64;
      };

      image.onerror = () => {
        this.profileImageError = "Profile image is not valid.";
        input.value = "";
      };

      image.src = profileImageBase64;
    };

    reader.onerror = () => {
      this.profileImageError = "Profile image could not be read.";
      input.value = "";
    };

    reader.readAsDataURL(file);
  }

  askToDeleteUser(user: UserModel) {
    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;
    this.editingUser = null;
    this.originalUser = null;
    this.userToDelete = user;
  }

  cancelDeleting() {
    this.userToDelete = null;
  }

  deleteUser() {
    if (this.userToDelete == null) return;

    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;
    let userId = this.userToDelete._id;

    this.userService.deleteUser(userId).subscribe({
      next: data => {
        this.showTemporaryMessage(data.message);
        this.userToDelete = null;
        this.loadUsers();
      },
      error: error => {
        this.messageIsError = true;
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while deleting user.";
        }
      }
    });
  }

  getRoleName(role: UserRole) {
    if (role == "individualClient") return "Individual client";
    if (role == "businessClient") return "Business client";
    if (role == "printer") return "Printing house";
    return "Administrator";
  }

  hasUserChanges() {
    if (this.editingUser == null || this.originalUser == null) return false;
    return JSON.stringify(this.editingUser) != JSON.stringify(this.originalUser);
  }

  showTemporaryMessage(message: string) {
    this.messageIsClosing = false;
    this.message = message;
    setTimeout(() => {
      if (this.message == message) this.closeMessage();
    }, 3500);
  }

  closeMessage() {
    if (!this.message || this.messageIsClosing) return;

    let messageToClose = this.message;
    this.messageIsClosing = true;

    setTimeout(() => {
      if (this.message == messageToClose) this.message = "";
      this.messageIsClosing = false;
    }, 220);
  }

}
