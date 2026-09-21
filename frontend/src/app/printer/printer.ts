import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';
import {UserModel} from '../models/user';

@Component({
  selector: 'app-printer',
  imports: [],
  templateUrl: './printer.html',
  styleUrl: './printer.css',
})
export class Printer implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null) {
      this.router.navigate([""]);
      return;
    }

    if (this.loggedUser.role != "printer") {
      this.router.navigate([""]);
      return;
    }
  }

}
