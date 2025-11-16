import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface InfoDialogData {
    title?: string;
    message: string;
}

@Component({
    selector: 'app-info-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <h2 mat-dialog-title *ngIf="data.title">{{ data.title }}</h2>
    <div mat-dialog-content>{{ data.message }}</div>
    <div mat-dialog-actions align="end">
      <button mat-button color="primary" (click)="close()" cdkFocusInitial>OK</button>
    </div>
  `
})
export class InfoDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: InfoDialogData,
        private ref: MatDialogRef<InfoDialogComponent>
    ) { }
    close() { this.ref.close(); }
}
