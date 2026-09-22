export class PrintingHouseRevenueModel {
  printingHouseId = "";
  printingHouseName = "";
  revenue = 0;
}

export class PopularProductModel {
  productId = "";
  productName = "";
  quantity = 0;
  percentage = 0;
}

export class RatingHistoryPointModel {
  date = "";
  score = 0;
}

export class ProductRatingStatisticsModel {
  productId = "";
  productName = "";
  ratingHistory: RatingHistoryPointModel[] = [];
}

export class AdminStatisticsModel {
  printingHouseRevenue: PrintingHouseRevenueModel[] = [];
  popularProducts: PopularProductModel[] = [];
  productRatings: ProductRatingStatisticsModel[] = [];
}
