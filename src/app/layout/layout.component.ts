import { Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '../theme.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { ButtonComponent } from '../shared/button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AvailabilityService } from '../availability.service';

@Component({
  selector: 'portfolio-layout',
  templateUrl: './layout.component.html',
  standalone: true,
  styleUrl: './layout.component.scss',
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    FooterComponent,
    ButtonComponent,
    MatSnackBarModule
  ]
})
export class LayoutComponent {
  currentYear = new Date().getFullYear();
  isMenuOpen = false;
  availableForFreelance = true;
  isOwner = false;
  badgePulse = false;

  constructor(private theme: ThemeService, private availability: AvailabilityService, private snack: MatSnackBar, private destroyRef: DestroyRef) {
    this.availableForFreelance = this.availability.value;
    this.isOwner = this.availability.isOwner;
    this.availability.available$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => (this.availableForFreelance = v));
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme.getCurrentTheme();
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleAvailability(): void {
    if (!this.availability.isOwner) {
      this.snack.open('Only the owner can toggle availability.', 'OK', { duration: 2000 });
      return;
    }
    this.availability.toggle();
    const msg = this.availability.value ? 'Availability: Available' : 'Availability: Booked';
    this.snack.open(msg, 'OK', { duration: 1600 });
    this.badgePulse = true; setTimeout(() => (this.badgePulse = false), 500);
  }
}
