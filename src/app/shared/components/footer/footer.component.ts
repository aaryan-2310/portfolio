import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WaitlistDialogComponent } from '../waitlist-dialog/waitlist-dialog.component';
import { SettingsService } from '../../../core/services/settings.service';
import { ContactService, SocialLink } from '../../../core/services/contact.service';
import { RouterModule } from '@angular/router';

// Footer Component
@Component({
  selector: 'portfolio-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent, MatSnackBarModule, MatDialogModule, RouterModule],
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
    private destroyRef: DestroyRef,
  ) { }

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        if (settings) {
          this.availableForFreelance = settings.availableForFreelance;
          this.calendlyUrl = settings.calendlyUrl;
          this.email = settings.email || 'contact@aryanmishra.work';
        }
      });

    // Fetch social links
    this.contactService.getSocialLinks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(links => {
        this.socialLinks = links.filter(l => l.showInFooter);
      });
  }

  getIconSvg(iconName: string): string {
    const iconMap: Record<string, string> = {
      'Github': 'M12 0.297C5.373 0.297 0 5.67 0 12.297c0 5.282 3.438 9.747 8.205 11.325.6.111.82-.261.82-.577 0-.285-.011-1.04-.017-2.042-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.625-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 22.04 24 17.576 24 12.297c0-6.627-5.373-12-12-12z',
      'Linkedin': 'M100.28 448H7.4V148.9h92.88zm-46.44-340.7C24.09 107.3 0 83.2 0 53.6A53.6 53.6 0 0 1 53.6 0c29.6 0 53.6 24.09 53.6 53.6 0 29.6-24.09 53.7-53.6 53.7zM447.8 448h-92.4V302.4c0-34.7-12.4-58.4-43.3-58.4-23.6 0-37.6 15.9-43.7 31.3-2.3 5.6-2.8 13.4-2.8 21.2V448h-92.4s1.2-242.1 0-267.1h92.4v37.9c12.3-19 34.3-46.1 83.5-46.1 60.9 0 106.6 39.8 106.6 125.4V448z',
      'Twitter': 'M1142.7 0H1052.6L600 661.2L147.4 0H57.3L527.2 700.2L57.3 1227H147.4L600 565.8L1052.6 1227H1142.7L672.8 700.2L1142.7 0Z',
      'Instagram': 'M224 202.7A53.3 53.3 0 1 0 224 309.3 53.3 53.3 0 1 0 224 202.7zm124.7-41c0-16.6-13.5-30.1-30.1-30.1H129.4c-16.6 0-30.1 13.5-30.1 30.1v189.6c0 16.6 13.5 30.1 30.1 30.1h189.2c16.6 0 30.1-13.5 30.1-30.1V161.7zm-30.1 0v189.6H129.4V161.7h189.2zm-94.6 53.3a70.7 70.7 0 1 1 0 141.4 70.7 70.7 0 1 1 0-141.4zm94.6-53.3a17.7 17.7 0 1 1 0 35.4 17.7 17.7 0 1 1 0-35.4z',
      'Youtube': 'M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z',
      'Facebook': 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z',
      'Mail': 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
      'Globe': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
      'Link': 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'
    };
    return iconMap[iconName] || iconMap['Link'];
  }

  getIconViewBox(iconName: string): string {
    const viewBoxMap: Record<string, string> = {
      'Github': '0 0 24 24',
      'Linkedin': '0 0 448 512',
      'Twitter': '0 0 1200 1227',
      'Instagram': '0 0 448 512',
      'Youtube': '0 0 576 512',
      'Facebook': '0 0 320 512',
      'Mail': '0 0 24 24',
      'Globe': '0 0 24 24',
      'Link': '0 0 24 24'
    };
    return viewBoxMap[iconName] || '0 0 24 24';
  }

  onPrimaryClick() {
    if (!this.availableForFreelance) {
      const ref = this.dialog.open(WaitlistDialogComponent, { width: '420px' });
      ref.afterClosed().subscribe(sent => {
        if (sent) this.snack.open('Thanks! I’ll reach out soon.', 'OK', { duration: 2500 });
      });
    }
  }
}

