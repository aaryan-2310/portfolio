import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import {
  ContactFormComponent,
  ContactFormData,
} from '../../shared/components/contact-form/contact-form.component';
import { ContactService, SocialLink } from '../../core/services/contact.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';

@Component({
  selector: 'portfolio-contact',
  standalone: true,
  imports: [CommonModule, ContactFormComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  settings$: Observable<SiteSettings | null>;
  socialLinks: SocialLink[] = [];

  constructor(
    private contactService: ContactService,
    private settingsService: SettingsService
  ) {
    this.settings$ = this.settingsService.settings$;
  }

  ngOnInit(): void {
    this.contactService.getSocialLinks().pipe(
      map(links => links
        .filter(l => l.showInContact)
      )
    ).subscribe(links => {
      this.socialLinks = links;
    });
  }

  async handleFormSubmit(data: ContactFormData): Promise<void> {
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.contactService.submitContact({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message
      }).toPromise();

      this.successMessage = "Thanks for reaching out! I'll get back to you within 24-48 hours.";
    } catch {
      this.errorMessage = 'Something went wrong. Please try again or email me directly.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
