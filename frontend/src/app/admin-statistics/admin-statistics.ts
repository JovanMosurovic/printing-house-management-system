import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AdminStatisticsModel, ProductRatingStatisticsModel} from '../models/statistics';
import {AuthService} from '../services/auth.service';
import {ProductService} from '../services/product.service';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-admin-statistics',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './admin-statistics.html',
  styleUrl: './admin-statistics.css',
})
export class AdminStatistics implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  statistics = new AdminStatisticsModel();
  selectedProductIds: string[] = [];
  chartColors = ["#007aff", "#ff9500", "#34c759", "#af52de", "#ff3b30", "#5ac8fa", "#ffcc00", "#5856d6"];
  message = "";

  ngOnInit() {
    let loggedUser = this.authService.getLoggedUser();

    if (loggedUser == null) {
      this.router.navigate(["/admin/login"]);
      return;
    }

    if (loggedUser.role != "admin") {
      this.router.navigate([""]);
      return;
    }

    this.loadStatistics();
  }

  loadStatistics() {
    this.productService.getAdminStatistics().subscribe({
      next: data => {
        this.statistics = data;
        this.selectedProductIds = [];

        for (let product of data.productRatings) {
          this.selectedProductIds.push(product.productId);
        }
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading statistics.";
        }
      }
    });
  }

  getRevenueBarWidth(revenue: number) {
    let maximumRevenue = 0;

    for (let printingHouse of this.statistics.printingHouseRevenue) {
      if (printingHouse.revenue > maximumRevenue) maximumRevenue = printingHouse.revenue;
    }

    if (maximumRevenue == 0) return 0;
    return revenue * 100 / maximumRevenue;
  }

  getChartColor(index: number) {
    return this.chartColors[index % this.chartColors.length];
  }

  getPieChartBackground() {
    if (this.statistics.popularProducts.length == 0) return "#e5e5ea";

    let backgroundParts = [];
    let startPercentage = 0;

    for (let i = 0; i < this.statistics.popularProducts.length; i++) {
      let endPercentage = startPercentage + this.statistics.popularProducts[i].percentage;
      if (i == this.statistics.popularProducts.length - 1) endPercentage = 100;
      backgroundParts.push(`${this.getChartColor(i)} ${startPercentage}% ${endPercentage}%`);
      startPercentage = endPercentage;
    }

    return `conic-gradient(${backgroundParts.join(", ")})`;
  }

  isProductSelected(productId: string) {
    return this.selectedProductIds.includes(productId);
  }

  toggleProduct(productId: string) {
    let productIndex = this.selectedProductIds.indexOf(productId);

    if (productIndex == -1) {
      this.selectedProductIds.push(productId);
    } else {
      this.selectedProductIds.splice(productIndex, 1);
    }
  }

  hasSelectedProducts() {
    return this.selectedProductIds.length > 0;
  }

  getMinimumRatingDate() {
    let minimumDate = Number.MAX_SAFE_INTEGER;

    for (let product of this.statistics.productRatings) {
      if (!this.isProductSelected(product.productId)) continue;

      for (let point of product.ratingHistory) {
        let date = new Date(point.date).getTime();
        if (date < minimumDate) minimumDate = date;
      }
    }

    return minimumDate == Number.MAX_SAFE_INTEGER ? new Date().getTime() : minimumDate;
  }

  getMaximumRatingDate() {
    let maximumDate = 0;

    for (let product of this.statistics.productRatings) {
      if (!this.isProductSelected(product.productId)) continue;

      for (let point of product.ratingHistory) {
        let date = new Date(point.date).getTime();
        if (date > maximumDate) maximumDate = date;
      }
    }

    return maximumDate == 0 ? new Date().getTime() : maximumDate;
  }

  getMinimumRating() {
    let minimumRating = Number.MAX_SAFE_INTEGER;

    for (let product of this.statistics.productRatings) {
      if (!this.isProductSelected(product.productId)) continue;
      for (let point of product.ratingHistory) {
        if (point.score < minimumRating) minimumRating = point.score;
      }
    }

    return minimumRating == Number.MAX_SAFE_INTEGER ? 0 : minimumRating;
  }

  getMaximumRating() {
    let maximumRating = Number.MIN_SAFE_INTEGER;

    for (let product of this.statistics.productRatings) {
      if (!this.isProductSelected(product.productId)) continue;
      for (let point of product.ratingHistory) {
        if (point.score > maximumRating) maximumRating = point.score;
      }
    }

    return maximumRating == Number.MIN_SAFE_INTEGER ? 0 : maximumRating;
  }

  getPointX(date: string) {
    let minimumDate = this.getMinimumRatingDate();
    let maximumDate = this.getMaximumRatingDate();

    if (minimumDate == maximumDate) return 400;
    return 60 + (new Date(date).getTime() - minimumDate) * 700 / (maximumDate - minimumDate);
  }

  getPointY(score: number) {
    let minimumRating = this.getMinimumRating();
    let maximumRating = this.getMaximumRating();

    if (minimumRating == maximumRating) return 160;
    return 20 + (maximumRating - score) * 280 / (maximumRating - minimumRating);
  }

  getRatingLinePoints(product: ProductRatingStatisticsModel) {
    let points = "";

    for (let point of product.ratingHistory) {
      points += `${this.getPointX(point.date)},${this.getPointY(point.score)} `;
    }

    return points.trim();
  }

  formatChartDate(date: number) {
    return new Date(date).toLocaleDateString("sr-RS");
  }

}
