import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Message } from '../models/msg';
import { UserType } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient)

  login(u: string, p: string){
    const data = {
      username: u,
      password: p
    }
    return this.http.post<UserType>(
      "http://localhost:4000/users/login", data)
  }

  register(u: UserType){
    return this.http.post<Message>(
      "http://localhost:4000/users/register", u)
  }

  deleteUser(u: string){
    console.log("user service delete")
    const data = {
      username: u
    }

    return this.http.post(
      "http://localhost:4000/users/delete", data)
  }
}
