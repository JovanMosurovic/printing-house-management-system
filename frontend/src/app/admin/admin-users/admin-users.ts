import {Component, inject, OnInit} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {copyUser, UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  users: UserModel[] = [];
  editingUser: UserModel | null = null;
  userToDelete: UserModel | null = null;
  message = "";

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
    this.userToDelete = null;
    this.editingUser = copyUser(user);
  }

  cancelEditing() {
    this.editingUser = null;
  }

  saveUser(userForm: NgForm) {
    this.message = "";

    if (userForm.invalid) {
      userForm.form.markAllAsTouched();
      return;
    }

    if (this.editingUser == null) return;

    this.userService.adminUpdateUser(this.editingUser).subscribe({
      next: data => {
        this.message = `User ${data.username} was successfully updated.`;
        this.editingUser = null;
        this.loadUsers();
      },
      error: error => {
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
    this.editingUser = null;
    this.userToDelete = user;
  }

  cancelDeleting() {
    this.userToDelete = null;
  }

  deleteUser() {
    if (this.userToDelete == null) return;

    this.message = "";
    let userId = this.userToDelete._id;

    this.userService.deleteUser(userId).subscribe({
      next: data => {
        this.message = data.message;
        this.userToDelete = null;
        this.loadUsers();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while deleting user.";
        }
      }
    });
  }

}
