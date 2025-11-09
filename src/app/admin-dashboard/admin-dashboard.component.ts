import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatHint } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HospitalDetailsComponent } from '../hospital-details/hospital-details.component';
import { HospitalService } from '../hospital-details/hospital.service';
import { ScrolldDirective } from '../scrolld.directive';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';


@Component({
  selector: 'app-admin-dashboard',
  imports: [MatIconModule, MatTooltipModule, MatCardModule, AppointmentUiComponent,
    ReactiveFormsModule, MatSelectModule, ScrolldDirective
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  encounterDropDown = new FormControl("Out-Patient")
  patientsDropDown = new FormControl("");
  todayAppointSelect = new FormControl("Remaining");


  hospital = inject(HospitalService);
}

