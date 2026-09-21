import {Component, inject, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {UserModel} from '../models/user';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router)

  pendingUsers: UserModel[] = [];
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

    this.loadPendingUsers();
  }

  loadPendingUsers() {
    this.userService.getPendingUsers().subscribe({
      next: data => {
        this.pendingUsers = data;
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading pending users.";
        }
      }
    });
  }

  updateUserStatus(userId: string, status: "approved" | "rejected") {
    this.message = "";

    this.userService.updateUserStatus(userId, status).subscribe({
      next: data => {
        this.message = data.message;
        this.loadPendingUsers();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while updating user status.";
        }
      }
    });
  }

}
