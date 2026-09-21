import {Component, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggedIn() {
    return this.authService.isLoggedIn();
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
