import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../button/button.component';
import { RippleDirective } from '../../directives/ripple.directive';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Reusable contact form component.
 * Can be embedded anywhere and emits form data on submit.
 *
 * Usage:
 *   <portfolio-contact-form
 *     (formSubmit)="handleSubmit($event)"
 *     [loading]="isSubmitting"
 *   ></portfolio-contact-form>
 */
@Component({
  selector: 'portfolio-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, RippleDirective],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent {
  /** Whether the form is in loading state */
  @Input() loading = false;

  /** Success message to display after submission */
  @Input() successMessage = '';

  /** Error message to display on submission failure */
  @Input() errorMessage = '';

  /** Emit form data when submitted */
  @Output() formSubmit = new EventEmitter<ContactFormData>();

  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid && !this.loading) {
      this.formSubmit.emit(this.contactForm.value as ContactFormData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.contactForm.reset();
  }

  // Helper getters for template
  get nameControl() {
    return this.contactForm.get('name');
  }
  get emailControl() {
    return this.contactForm.get('email');
  }
  get subjectControl() {
    return this.contactForm.get('subject');
  }
  get messageControl() {
    return this.contactForm.get('message');
  }
}
