import { Component, DestroyRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '../core/services/theme.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule, NgOptimizedImage, DOCUMENT } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { ButtonComponent } from '../shared/button/button.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../core/services/settings.service';
import { A11yModule } from '@angular/cdk/a11y';
import { AvailabilityBadgeComponent } from '../shared/components/availability-badge/availability-badge.component';
import { ChatWidgetComponent } from '../shared/components/chat-widget/chat-widget.component';

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
    AvailabilityBadgeComponent,
    ChatWidgetComponent,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  private _mobileMenuOpen = false;
  availableForFreelance = false;
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
    private settingsService: SettingsService,
    private destroyRef: DestroyRef,
  ) { }

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        if (settings) {
          this.availableForFreelance = settings.availableForFreelance;
        }
      });
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme.getCurrentTheme();
  }

  toggleTheme() {
    this.theme.toggle();
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

  ngOnDestroy(): void {
    // Clean up body overflow style to prevent it persisting
    this.document.body.style.overflow = '';
  }
}
