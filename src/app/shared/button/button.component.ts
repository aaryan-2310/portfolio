import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'portfolio-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() variant: 'primary' | 'secondary' | 'tonal' | 'ghost' | 'link' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;

  // Optional semantic attributes
  @Input({ alias: 'ariaLabel' }) ariaLabel?: string;

  // Navigation support
  @Input() href?: string;
  @Input() routerLink?: any;
  @Input() target?: '_self' | '_blank' | '_parent' | '_top' = '_self';
  @Input() rel?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  // Events
  @Output() clicked = new EventEmitter<Event>();

  classes = computed(() => {
    const list = ['btn', `btn--${this.variant}`, `btn--${this.size}`];
    if (this.loading) list.push('btn--loading');
    if (this.disabled) list.push('btn--disabled');
    return list.join(' ');
  });

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
