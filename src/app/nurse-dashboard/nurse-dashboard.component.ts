import { Component } from '@angular/core';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';

@Component({
  selector: 'app-nurse-dashboard',
  imports: [AppointmentUiComponent],
  templateUrl: './nurse-dashboard.component.html',
  styleUrl: './nurse-dashboard.component.scss'
})
export class NurseDashboardComponent {

}
