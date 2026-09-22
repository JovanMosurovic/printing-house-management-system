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
    this.userToDelete = null;
    this.originalUser = copyUser(user);
    this.editingUser = copyUser(user);
  }

  cancelEditing() {
    this.editingUser = null;
    this.originalUser = null;
  }

  saveUser(userForm: NgForm) {
    this.message = "";
    this.messageIsError = false;
    this.messageIsClosing = false;

    if (userForm.invalid) {
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
