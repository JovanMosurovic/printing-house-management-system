import {Component, inject} from '@angular/core';
import {UserService} from '../services/user.service';
import {LoginModel} from '../models/login';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-homepage',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage {
  private userService = inject(UserService);

  loginUser = new LoginModel();

  login() {
    this.userService.login(this.loginUser).subscribe(data => {
      if (data != null) {
        alert(`Welcome ${data.firstName} ${data.lastName}`);
      } else {
        alert("Wrong credentials or the account is not approved.");
      }
    });
  }
}
