import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ContactFormComponent,
  ContactFormData,
} from '../../shared/components/contact-form/contact-form.component';

@Component({
  selector: 'portfolio-contact',
  standalone: true,
  imports: [CommonModule, ContactFormComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  // Social links for the sidebar
  socialLinks = [
    {
      name: 'GitHub',
      icon: 'assets/icons/github.svg',
      url: 'https://github.com/aaryan-2310',
    },
    {
      name: 'LinkedIn',
      icon: 'assets/icons/linkedin.svg',
      url: 'https://linkedin.com/in/aaryan-2310',
    },
    {
      name: 'X (Twitter)',
      icon: 'assets/icons/x.svg',
      url: 'https://x.com/aaryan_2310',
    },
  ];

  async handleFormSubmit(data: ContactFormData): Promise<void> {
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Simulate API call - replace with actual backend integration
      await this.sendContactEmail(data);

      this.successMessage = "Thanks for reaching out! I'll get back to you within 24-48 hours.";
    } catch {
      this.errorMessage = 'Something went wrong. Please try again or email me directly.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private sendContactEmail(data: ContactFormData): Promise<void> {
    // Simulate network delay
    // TODO: Replace with actual email service (e.g., EmailJS, Formspree, or custom API)
    console.log('Contact form submitted:', data);
    return new Promise(resolve => setTimeout(resolve, 1500));
  }
}
