import { Component, Inject } from '@angular/core';
interface WaitlistDialogData {
  // Add properties as needed, or leave empty if no data is expected
}
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './waitlist-dialog.component.html',
  styleUrls: ['./waitlist-dialog.component.scss'],
})
export class WaitlistDialogComponent {
  form = this._buildForm();
  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<WaitlistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WaitlistDialogData,
  ) {}

  private _buildForm() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ["I'd like to join the waitlist."],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const subject = encodeURIComponent('Waitlist request');
    const body = encodeURIComponent(`Name: ${v.name}\nEmail: ${v.email}\n\n${v.message}`);
    window.location.href = `mailto:contact@example.com?subject=${subject}&body=${body}`;
    this.ref.close(true);
  }
}
