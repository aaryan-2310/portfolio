import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WaitlistDialogComponent } from '../waitlist-dialog/waitlist-dialog.component';
import { SettingsService } from '../../../core/services/settings.service';

// Footer Component
@Component({
  selector: 'portfolio-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent, MatSnackBarModule, MatDialogModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  year = new Date().getFullYear();
  availableForFreelance = false;
  calendlyUrl = '';
  email = '';

  constructor(
    private settingsService: SettingsService,
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

