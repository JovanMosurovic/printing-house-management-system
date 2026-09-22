import {Component, inject, OnInit} from '@angular/core';
import {DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {PublicProcurementModel} from '../models/public-procurement';
import {UserModel} from '../models/user';
import {AuthService} from '../services/auth.service';
import {PublicProcurementService} from '../services/public-procurement.service';

@Component({
  selector: 'app-printer-auctions',
  imports: [DatePipe, RouterLink],
  templateUrl: './printer-auctions.html',
  styleUrl: './printer-auctions.css',
})
export class PrinterAuctions implements OnInit {
  private authService = inject(AuthService);
  private publicProcurementService = inject(PublicProcurementService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  publicProcurements: PublicProcurementModel[] = [];
  submittingPublicProcurementId = "";
  message = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || this.loggedUser.role != "printer") {
      this.router.navigate([""]);
      return;
    }

    this.loadPublicProcurements();
  }

  loadPublicProcurements() {
    if (this.loggedUser == null) return;

    this.publicProcurementService.getOpenPublicProcurements(this.loggedUser._id).subscribe({
      next: data => {
        this.publicProcurements = data;
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while loading public procurements.";
        }
      }
    });
  }

  submitOffer(publicProcurementId: string) {
    if (this.loggedUser == null) return;

    this.message = "";
    this.submittingPublicProcurementId = publicProcurementId;

    this.publicProcurementService.submitOffer(this.loggedUser._id, publicProcurementId).subscribe({
      next: data => {
        this.message = data.message;
        this.submittingPublicProcurementId = "";
        this.loadPublicProcurements();
      },
      error: error => {
        if (error.error?.message) {
          this.message = error.error.message;
        } else {
          this.message = "Unexpected error while submitting the offer.";
        }

        this.submittingPublicProcurementId = "";
      }
    });
  }

}
