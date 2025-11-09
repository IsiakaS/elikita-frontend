import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Bundle, Patient } from 'fhir/r4';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-patient-registration-approved',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
    template: `
  <mat-card>
    <mat-card-header>
      <mat-card-title>Approved Patients</mat-card-title>
      <mat-card-subtitle>Patients whose registrations are active.</mat-card-subtitle>
    </mat-card-header>
    <mat-card-content>
      <table mat-table [dataSource]="approvedPatients" class="mat-elevation-z8" *ngIf="approvedPatients.length > 0; else noApproved">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let p">{{p.name?.[0]?.family}} {{p.name?.[0]?.given?.[0]}}</td>
        </ng-container>
        <ng-container matColumnDef="gender">
          <th mat-header-cell *matHeaderCellDef>Gender</th>
          <td mat-cell *matCellDef="let p">{{p.gender || 'N / A'}}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <ng-template #noApproved>
        <div class="subtitle-text-color-2">No approved patients.</div>
      </ng-template>
    </mat-card-content>
  </mat-card>
  `,
    styles: [``]
})
export class PatientRegistrationApprovedComponent {
    route = inject(ActivatedRoute);
    approvedPatients: Patient[] = [];
    displayedColumns = ['name', 'gender'];
    ngOnInit() {
        const bundle = this.route.parent?.snapshot.data['patientCenter'] as Bundle;
        const entries = bundle?.entry || [];
        this.approvedPatients = entries.map(e => e.resource as Patient).filter(p => p.active === true && !(p as any).deceasedBoolean && !(p as any).deceasedDateTime);
    }
}
