import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  getLoggedUser() {
    return this.authService.getLoggedUser();
  }

  getHomeRoute() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser?.role == "admin") return "/admin";
    if (loggedUser?.role == "printer") return "/printer";
    if (loggedUser?.role == "individualClient" || loggedUser?.role == "businessClient") return "/client";
    return "/";
  }

  logout() {
    let loggedUser = this.authService.getLoggedUser();

    this.authService.logout();

    if (loggedUser?.role == "admin") {
      this.router.navigate(["/admin/login"]);
    } else {
      this.router.navigate([""]);
    }
  }
}
