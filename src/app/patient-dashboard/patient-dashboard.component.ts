import { Component } from '@angular/core';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';

@Component({
  selector: 'app-patient-dashboard',
  imports: [AppointmentUiComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent {

}
