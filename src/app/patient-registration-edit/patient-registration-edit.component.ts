import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Patient } from 'fhir/r4';

@Component({
    selector: 'app-patient-registration-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
    template: `
  <h2 mat-dialog-title>Edit Patient Registration</h2>
  <form [formGroup]="form" class="dialog-form" (ngSubmit)="save()">
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Family Name</mat-label>
      <input matInput formControlName="family">
    </mat-form-field>
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Given Name</mat-label>
      <input matInput formControlName="given">
    </mat-form-field>
    <div class="actions g-just-flex gap-10">
      <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
    </div>
  </form>
  `,
    styles: [`.dialog-form{display:flex;flex-direction:column;gap:12px;width:320px;}`]
})
export class PatientRegistrationEditComponent {
    form: FormGroup;
    dialogRef = inject(MatDialogRef<PatientRegistrationEditComponent>);
    data = inject(MAT_DIALOG_DATA) as Patient;
    constructor() {
        this.form = new FormGroup({
            family: new FormControl(this.data?.name?.[0]?.family || ''),
            given: new FormControl(this.data?.name?.[0]?.given?.[0] || ''),
        });
    }
    save() {
        const val = this.form.value;
        this.dialogRef.close({ updated: true, patch: val });
    }
}
