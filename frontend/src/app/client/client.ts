import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {UserModel} from '../models/user';

@Component({
  selector: 'app-client',
  imports: [],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class Client implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null) {
      this.router.navigate([""]);
      return;
    }

    if (this.loggedUser.role != "individualClient" &&
      this.loggedUser.role != "businessClient") {
      this.router.navigate([""]);
      return;
    }
  }

}
