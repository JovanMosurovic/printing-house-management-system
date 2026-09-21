import { Routes } from '@angular/router';
import {Homepage} from './homepage/homepage';
import {Register} from './register/register';
import {AdminLogin} from './admin-login/admin-login';

export const routes: Routes = [
  { path: "", component: Homepage },
  { path: "register", component: Register },
  { path: "admin/login", component: AdminLogin },
  { path: "**", redirectTo: "" } // wildcard route, for every route that is not defined
];
