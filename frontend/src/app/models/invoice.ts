import {PreparationType} from './cart';

export type InvoiceStatus = "ordered" | "inPrinting" | "delivered" | "received" | "cancelled";

export type InvoiceSortField = "invoiceId" | "printingHouseName" | "printingHouseCity" | "totalPrice" | "status" | "createdAt";

export type ProductArchiveSortField = "productName" | "quantity" | "printingHouseName" | "orderDate";

export type PaymentMethod = "" | "card" | "publicProcurement";

export type PaymentStatus = "" | "paid" | "refunded" | "notApplicable";

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
  paymentMethod: PaymentMethod = "";
  paymentStatus: PaymentStatus = "";
  cardLastFour = "";

  createdAt = "";
  updatedAt = "";
}

export class ConfirmOrderResponseModel {
  message = "";
  invoices: InvoiceModel[] = [];
  emailSent = false;
}

export class ArchivedProductModel {
  invoiceId = "";
  productId = "";
  productName = "";
  quantity = 0;
  printingHouseName = "";
  status: InvoiceStatus = "delivered";
  orderDate = "";
  numberOfLikes = 0;
  numberOfDislikes = 0;
  clientReaction: "" | "like" | "dislike" = "";
  commentText = "";
  commentMessage = "";
  commentMessageIsError = false;
}
