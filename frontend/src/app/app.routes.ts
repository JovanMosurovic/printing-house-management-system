import { Routes } from '@angular/router';
import {Homepage} from './homepage/homepage';
import {Register} from './register/register';

export const routes: Routes = [
  { path: "", component: Homepage },
  { path: "register", component: Register },
  { path: "**", redirectTo: "" } // wildcard route, for every route that is not defined
];
