import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'portfolio-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './portfolio-card.component.html',
    styleUrl: './portfolio-card.component.scss'
})
export class PortfolioCardComponent {
    @Input() title = '';
    @Input() description = '';
    @Input() image?: string;
    @Input() gradient?: string;
    @Input() routerLink?: any[] | string | null;
    @Input() index = 0; // For stagger animation
}
