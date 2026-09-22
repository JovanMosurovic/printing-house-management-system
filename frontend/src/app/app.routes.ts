import { Routes } from '@angular/router';
import {Homepage} from './public/homepage/homepage';
import {Register} from './public/register/register';
import {AdminLogin} from './admin/admin-login/admin-login';
import {Admin} from './admin/admin/admin';
import {Client} from './client/client/client';
import {Printer} from './printer/printer/printer';
import {ForgotPassword} from './public/forgot-password/forgot-password';
import {ResetPassword} from './public/reset-password/reset-password';
import {ProductDetails} from './product/product-details/product-details';
import {ClientProducts} from './client/client-products/client-products';
import {ProductPreparation} from './product/product-preparation/product-preparation';
import {Cart} from './client/cart/cart';
import {ProductArchive} from './client/product-archive/product-archive';
import {PrinterProducts} from './printer/printer-products/printer-products';
import {ProductImport} from './printer/product-import/product-import';
import {PrinterAuctions} from './printer/printer-auctions/printer-auctions';
import {ClientPublicProcurements} from './client/client-public-procurements/client-public-procurements';
import {AdminUsers} from './admin/admin-users/admin-users';
import {AdminCategories} from './admin/admin-categories/admin-categories';
import {AdminStatistics} from './admin/admin-statistics/admin-statistics';
import {Payment} from './client/payment/payment';

export const routes: Routes = [
  { path: "", component: Homepage },
  { path: "register", component: Register },
  { path: "admin/login", component: AdminLogin },
  { path: "admin/users", component: AdminUsers },
  { path: "admin/categories", component: AdminCategories },
  { path: "admin/statistics", component: AdminStatistics },
  { path: "admin", component: Admin },

  { path: "client/cart", component: Cart },
  { path: "client/payment", component: Payment },
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
