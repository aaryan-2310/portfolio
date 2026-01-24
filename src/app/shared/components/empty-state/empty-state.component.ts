import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'portfolio-empty-state',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
    @Input() icon: string = 'article';
    @Input() title: string = 'No content found';
    @Input() message: string = '';
}
