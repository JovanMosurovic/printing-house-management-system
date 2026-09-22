export type PreparationType = "text" | "image";

export class CartItemModel {
  productId = "";
  printingHouseId = "";
  printingHouseName = "";

  productName = "";
  productImage = "";
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

export class PrintingHouseCartModel {
  printingHouseId = "";
  printingHouseName = "";
  items: CartItemModel[] = [];
  totalPrice = 0;
}
