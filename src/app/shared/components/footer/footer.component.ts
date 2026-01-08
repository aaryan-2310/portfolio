import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WaitlistDialogComponent } from '../waitlist-dialog/waitlist-dialog.component';
import { SettingsService } from '../../../core/services/settings.service';
import { ContactService, SocialLink } from '../../../core/services/contact.service';
import { RouterModule } from '@angular/router';
import { getIconViewBox, getIconSvg } from '../../utils';
import { AvailabilityBadgeComponent } from '../availability-badge/availability-badge.component';

// Footer Component
@Component({
  selector: 'portfolio-footer',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatIconModule, ButtonComponent, MatSnackBarModule, MatDialogModule, RouterModule, AvailabilityBadgeComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  year = new Date().getFullYear();
  availableForFreelance = false;
  calendlyUrl = '';
  email = '';
  socialLinks: SocialLink[] = [];

  constructor(
    private settingsService: SettingsService,
    private contactService: ContactService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.settingsService.settings$
      .subscribe(settings => {
        if (settings) {
          this.availableForFreelance = settings.availableForFreelance;
          this.calendlyUrl = settings.calendlyUrl;
          this.email = settings.email || 'contact@aryanmishra.work';
        }
      });

    this.contactService.getSocialLinks()
      .subscribe(links => {
        this.socialLinks = links.filter(link => link.showInFooter)
          .sort((a, b) => a.displayOrder - b.displayOrder);
      });
  }

  onPrimaryClick() {
    if (!this.availableForFreelance) {
      const ref = this.dialog.open(WaitlistDialogComponent, { width: '420px' });
      ref.afterClosed().subscribe(sent => {
        if (sent) this.snack.open('Thanks! I\'ll reach out soon.', 'OK', { duration: 2500 });
      });
    }
  }

  // Icon utility wrappers for template
  getIconViewBox = getIconViewBox;
  getIconSvg = getIconSvg;
}

