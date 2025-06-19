import { Component, inject } from '@angular/core';
import { DoctorsDashboardComponent } from '../doctors-dashboard/doctors-dashboard.component';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { LabDashboardComponent } from '../lab-dashboard/lab-dashboard.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboards-wrapper',
  imports: [DoctorsDashboardComponent, LabDashboardComponent, AdminDashboardComponent],
  templateUrl: './dashboards-wrapper.component.html',
  styleUrl: './dashboards-wrapper.component.scss'
})
export class DashboardsWrapperComponent {
  auth = inject(AuthService);
  router = inject(Router);
  role: any;
  user: any;

  ngOnInit() {
    this.user = this.auth.user.getValue();
    if (this.user == null) {
      this.router.navigate(["/login"]);
    }
  }

}
