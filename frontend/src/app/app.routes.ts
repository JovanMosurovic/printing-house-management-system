import { Routes } from '@angular/router';
import {Homepage} from './homepage/homepage';
import {Register} from './register/register';
import {AdminLogin} from './admin-login/admin-login';
import {Admin} from './admin/admin';
import {Client} from './client/client';
import {Printer} from './printer/printer';
import {ForgotPassword} from './forgot-password/forgot-password';
import {ResetPassword} from './reset-password/reset-password';

export const routes: Routes = [
  { path: "", component: Homepage },
  { path: "register", component: Register },
  { path: "admin/login", component: AdminLogin },
  { path: "admin", component: Admin },

  { path: "client", component: Client },
  { path: "printer", component: Printer },

  { path: "forgot-password", component: ForgotPassword },
  { path: "reset-password/:token", component: ResetPassword },

  { path: "**", redirectTo: "" } // wildcard route, for every route that is not defined
];
