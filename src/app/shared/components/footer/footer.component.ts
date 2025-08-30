import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../button/button.component';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WaitlistDialogComponent } from '../waitlist-dialog/waitlist-dialog.component';
import { AvailabilityService } from '../../../availability.service';

@Component({
  selector: 'portfolio-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent, MatSnackBarModule, MatDialogModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  year = new Date().getFullYear();
  availableForFreelance = true;
  readonly calendlyUrl = 'https://calendly.com/mishra-ary';

  constructor(private availability: AvailabilityService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.availableForFreelance = this.availability.value;
    this.availability.available$.subscribe(v => (this.availableForFreelance = v));
  }

  toggleAvailability(): void {
    if (!this.availability.isOwner) {
      this.snack.open('Only the owner can toggle availability.', 'OK', { duration: 2000 });
      return;
    }
    this.availability.toggle();
    const msg = this.availability.value ? 'Availability set to: Available' : 'Availability set to: Booked';
    this.snack.open(msg, 'OK', { duration: 2000 });
  }

  onPrimaryClick() {
    if (!this.availableForFreelance) {
      const ref = this.dialog.open(WaitlistDialogComponent, { width: '420px' });
      ref.afterClosed().subscribe(sent => {
        if (sent) this.snack.open('Thanks! I’ll reach out soon.', 'OK', { duration: 2500 });
      });
    }
  }
}
