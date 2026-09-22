import {PreparationType} from './cart';

export type InvoiceStatus = "ordered" | "inPrinting" | "delivered" | "received" | "cancelled";

export class InvoiceItemModel {
  productId = "";
  productCode = "";
  productName = "";
  color = "";

  printingServiceId = "";
  printingType = "";

  unitPrice = 0;
  additionalPricePerItem = 0;
  quantity = 0;
  totalPrice = 0;

  preparationType: PreparationType = "text";
  preparationText = "";
  preparationImage = "";
}

export class InvoiceModel {
  _id = "";
  clientId = "";
  clientUsername = "";
  clientEmail = "";

  printingHouseId = "";
  printingHouseName = "";
  printingHouseCity = "";

  items: InvoiceItemModel[] = [];
  totalPrice = 0;
  status: InvoiceStatus = "ordered";

  createdAt = "";
  updatedAt = "";
}

export class ConfirmOrderResponseModel {
  message = "";
  invoices: InvoiceModel[] = [];
  emailSent = false;
}
