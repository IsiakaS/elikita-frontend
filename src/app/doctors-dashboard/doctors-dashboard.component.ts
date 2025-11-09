import { Component, inject, Inject, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatInputModule } from '@angular/material/input'
import { MatFormField } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider'
import { MatChipsModule } from '@angular/material/chips'
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppointmentComponent } from '../appointment/appointment.component';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';


@Component({
  selector: 'app-doctors-dashboard',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive, CommonModule, AppointmentComponent,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule, AppointmentUiComponent,
    MatMenuModule,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './doctors-dashboard.component.html',
  styleUrl: './doctors-dashboard.component.scss'
})
export class DoctorsDashboardComponent {
  @Input() isConsultant: boolean = false;
  encounterService = inject(EncounterServiceService);


}
''