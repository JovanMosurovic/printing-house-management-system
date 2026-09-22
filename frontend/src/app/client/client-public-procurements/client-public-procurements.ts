import {Component, inject, OnInit} from '@angular/core';
import {DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {PublicProcurementModel} from '../../models/public-procurement';
import {UserModel} from '../../models/user';
import {AuthService} from '../../services/auth.service';
import {PublicProcurementService} from '../../services/public-procurement.service';

@Component({
  selector: 'app-client-public-procurements',
  imports: [DatePipe, RouterLink],
  templateUrl: './client-public-procurements.html',
  styleUrl: './client-public-procurements.css',
})
export class ClientPublicProcurements implements OnInit {
  private authService = inject(AuthService);
  private publicProcurementService = inject(PublicProcurementService);
  private router = inject(Router);

  loggedUser: UserModel | null = null;
  publicProcurements: PublicProcurementModel[] = [];
  message = "";

  ngOnInit() {
    this.loggedUser = this.authService.getLoggedUser();

    if (this.loggedUser == null || this.loggedUser.role != "businessClient") {
      this.router.navigate([""]);
      return;
    }

    this.loadPublicProcurements();
  }

  loadPublicProcurements() {
    if (this.loggedUser == null) return;

    this.publicProcurementService.getClientPublicProcurements(this.loggedUser._id).subscribe({
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

  isWinningOffer(publicProcurement: PublicProcurementModel, offerId: string) {
    return publicProcurement.winningOfferId == offerId;
  }

  downloadReport(publicProcurementId: string) {
    if (this.loggedUser == null) return;

    this.message = "";

    this.publicProcurementService.downloadPublicProcurementReport(this.loggedUser._id, publicProcurementId).subscribe({
      next: data => {
        let url = URL.createObjectURL(data);
        let link = document.createElement("a");
        link.href = url;
        link.download = `public_procurement_${publicProcurementId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.message = "Unexpected error while downloading the public procurement report.";
      }
    });
  }

}
