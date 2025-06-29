import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'portfolio-layout',
  templateUrl: './layout.component.html',
  standalone: true,
  styleUrl: './layout.component.scss',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    FooterComponent
  ]
})
export class LayoutComponent {
  currentYear = new Date().getFullYear();
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
