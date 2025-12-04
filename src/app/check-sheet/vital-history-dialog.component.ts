import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, DatePipe } from '@angular/common';
import { ChipsDirective } from '../chips.directive';

@Component({
  selector: 'app-vital-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule, DatePipe, ChipsDirective],
  template: `
    <h2 mat-dialog-title>{{ data.vitalName }} History</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.history" class="w-100">
        <ng-container matColumnDef="effectiveDateTime">
          <th mat-header-cell *matHeaderCellDef>Date/Time</th>
          <td mat-cell *matCellDef="let h">
            <div class="top">
            {{ h.original.effectiveDateTime | date:'mediumDate' }}</div>
            <div class="bottom subtitle-text-color-2">
               {{ h.original.effectiveDateTime | date:'mediumTime' }}
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="value">
          <th mat-header-cell *matHeaderCellDef>Value</th>
          <td mat-cell *matCellDef="let h">{{ h.value }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let h">
            <span [appChips]="h.status"></span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['effectiveDateTime', 'value', 'status']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['effectiveDateTime', 'value', 'status'];"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    table { width: 100%; }
  `]
})
export class VitalHistoryDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { vitalName: string; history: any[] };
}
