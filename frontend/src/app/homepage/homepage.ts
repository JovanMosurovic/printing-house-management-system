import { Component, inject } from '@angular/core';
import { User } from '../services/user';
import { UserType } from '../models/user';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  imports: [FormsModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage {

  private userService = inject(User)

  username  = ""
  password = ""

  private router = inject(Router);

  login(){
    this.userService.login(this.username, this.password).subscribe((user)=>{
      if(user){
        this.router.navigate(["/user"]);
      }
      else{
        alert("No user")
      }
    })

  }

  user: UserType = new UserType()

  register(){
    this.userService.register(this.user).subscribe((msg)=>{
      alert(msg.message)
    })
  }
}
