import { Component } from '@angular/core';
import { DoctorsDashboardComponent } from '../doctors-dashboard/doctors-dashboard.component';

@Component({
  selector: 'app-consultant-dashboard',
  imports: [DoctorsDashboardComponent],
  templateUrl: './consultant-dashboard.component.html',
  styleUrl: './consultant-dashboard.component.scss'
})
export class ConsultantDashboardComponent {

}
