import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-add-other-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>Add Other</h2>
    <div mat-dialog-content>
      <p>Enter a custom value for {{ data.fieldName }}:</p>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Custom value</mat-label>
        <input matInput [(ngModel)]="customValue" (keyup.enter)="submit()" />
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!customValue || !customValue.trim()">Add</button>
    </div>
  `
})
export class AddOtherDialogComponent {
    customValue = '';
    data = inject(MAT_DIALOG_DATA) as { fieldName: string };
    dialogRef = inject(MatDialogRef<AddOtherDialogComponent>);

    submit() {
        const v = (this.customValue || '').trim();
        if (v) {
            this.dialogRef.close(v);
        }
    }
}
