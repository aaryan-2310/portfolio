import { Component, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '../theme.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule, NgOptimizedImage, DOCUMENT } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { ButtonComponent } from '../shared/button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AvailabilityService } from '../availability.service';
import { inject } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

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
    MatSnackBarModule,
    A11yModule,
  ],
})
export class LayoutComponent {
  currentYear = new Date().getFullYear();
  private _mobileMenuOpen = false;
  availableForFreelance = true;
  isOwner = false;
  badgePulse = false;
  isScrolled = false;

  private document = inject(DOCUMENT);

  get mobileMenuOpen(): boolean {
    return this._mobileMenuOpen;
  }

  set mobileMenuOpen(value: boolean) {
    this._mobileMenuOpen = value;
    if (value) {
      this.document.body.style.overflow = 'hidden';
    } else {
      this.document.body.style.overflow = '';
    }
  }

  constructor(
    private theme: ThemeService,
    private availability: AvailabilityService,
    private snack: MatSnackBar,
    private destroyRef: DestroyRef,
  ) {
    this.availableForFreelance = this.availability.value;
    this.isOwner = this.availability.isOwner;
    this.availability.available$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => (this.availableForFreelance = v));
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
    this.badgePulse = true;
    setTimeout(() => (this.badgePulse = false), 500);
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window === 'undefined') {
      return;
    }
    this.isScrolled = window.scrollY > 10;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }
}
