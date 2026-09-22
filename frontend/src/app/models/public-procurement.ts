import {PreparationType} from './cart';

export type PublicProcurementStatus = "open" | "completed" | "unsuccessful";

export class PublicProcurementItemModel {
  _id = "";
  productName = "";
  category = "";
  subcategory = "";
  color = "";
  printingType = "";
  quantity = 0;
  preparationType: PreparationType = "text";
  preparationText = "";
  preparationImage = "";
}

export class PublicProcurementOfferItemModel {
  procurementItemId = "";
  productId = "";
  productCode = "";
  productName = "";
  printingServiceId = "";
  printingType = "";
  unitPrice = 0;
  additionalPricePerItem = 0;
  quantity = 0;
  totalPrice = 0;
}

export class PublicProcurementOfferModel {
  _id = "";
  printerId = "";
  printingHouseName = "";
  printingHouseCity = "";
  items: PublicProcurementOfferItemModel[] = [];
  totalPrice = 0;
  createdAt = "";
}

export class PublicProcurementModel {
  _id = "";
  clientId = "";
  clientUsername = "";
  clientEmail = "";
  institutionName = "";
  items: PublicProcurementItemModel[] = [];
  offers: PublicProcurementOfferModel[] = [];
  expiresAt = "";
  status: PublicProcurementStatus = "open";
  winningOfferId: string | null = null;
  winningPrinterId: string | null = null;
  invoiceId: string | null = null;
  hasSubmittedOffer = false;
  numberOfOffers = 0;
  createdAt = "";
  updatedAt = "";
}

export class CreatePublicProcurementResponseModel {
  message = "";
  publicProcurement = new PublicProcurementModel();
  emailSent = false;
}

export class SubmitPublicProcurementOfferResponseModel {
  message = "";
  offer = new PublicProcurementOfferModel();
}
