import { Routes } from '@angular/router';
import {Homepage} from './homepage/homepage';
import {Register} from './register/register';
import {AdminLogin} from './admin-login/admin-login';
import {Admin} from './admin/admin';
import {Client} from './client/client';
import {Printer} from './printer/printer';
import {ForgotPassword} from './forgot-password/forgot-password';
import {ResetPassword} from './reset-password/reset-password';
import {ProductDetails} from './product-details/product-details';
import {ClientProducts} from './client-products/client-products';
import {ProductPreparation} from './product-preparation/product-preparation';
import {Cart} from './cart/cart';
import {ProductArchive} from './product-archive/product-archive';
import {PrinterProducts} from './printer-products/printer-products';
import {ProductImport} from './product-import/product-import';
import {PrinterAuctions} from './printer-auctions/printer-auctions';
import {ClientPublicProcurements} from './client-public-procurements/client-public-procurements';
import {AdminUsers} from './admin-users/admin-users';
import {AdminCategories} from './admin-categories/admin-categories';

export const routes: Routes = [
  { path: "", component: Homepage },
  { path: "register", component: Register },
  { path: "admin/login", component: AdminLogin },
  { path: "admin/users", component: AdminUsers },
  { path: "admin/categories", component: AdminCategories },
  { path: "admin", component: Admin },

  { path: "client/cart", component: Cart },
  { path: "client/archive", component: ProductArchive },
  { path: "client/products", component: ClientProducts },
  { path: "client/public-procurements", component: ClientPublicProcurements },
  { path: "client", component: Client },
  { path: "printer/products/import", component: ProductImport },
  { path: "printer/products", component: PrinterProducts },
  { path: "printer/auctions", component: PrinterAuctions },
  { path: "printer", component: Printer },

  { path: "forgot-password", component: ForgotPassword },
  { path: "reset-password/:token", component: ResetPassword },

  { path: "product/:productId/preparation", component: ProductPreparation },
  { path: "product/:productId", component: ProductDetails },

  { path: "**", redirectTo: "" } // wildcard route, for every route that is not defined
];
