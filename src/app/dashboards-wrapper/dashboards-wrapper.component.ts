import { Component, inject } from '@angular/core';
import { DoctorsDashboardComponent } from '../doctors-dashboard/doctors-dashboard.component';
import { AuthService } from '../shared/auth/auth.service';
import { Router } from '@angular/router';
import { LabDashboardComponent } from '../lab-dashboard/lab-dashboard.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { PatientDashboardComponent } from '../patient-dashboard/patient-dashboard.component';
import { PharmacyDashboardComponent } from '../pharmacy-dashboard/pharmacy-dashboard.component';
import { NurseDashboardComponent } from '../nurse-dashboard/nurse-dashboard.component';
import { ConsultantDashboardComponent } from '../consultant-dashboard/consultant-dashboard.component';
import { CashierDashboardComponent } from '../cashier-dashboard/cashier-dashboard.component';

@Component({
  selector: 'app-dashboards-wrapper',
  imports: [DoctorsDashboardComponent, CashierDashboardComponent,
    NurseDashboardComponent,
    LabDashboardComponent, AdminDashboardComponent,
    ConsultantDashboardComponent,
    PatientDashboardComponent, PharmacyDashboardComponent],
  templateUrl: './dashboards-wrapper.component.html',
  styleUrl: './dashboards-wrapper.component.scss'
})
export class DashboardsWrapperComponent {
  auth = inject(AuthService);
  router = inject(Router);
  role: any;
  user: any;

  ngOnInit() {
    this.auth.user.subscribe((e) => {
      this.user = e;
      // getValue();
    })
    if (this.user == null) {
      this.router.navigate(["/login"]);
    }
  }

}
