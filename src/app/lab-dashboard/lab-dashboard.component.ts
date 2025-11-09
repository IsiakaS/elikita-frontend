import { Component, inject } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { ScrolldDirective } from '../scrolld.directive';
import { DashboardTasksComponent } from '../dashboard-tasks/dashboard-tasks.component'
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { CardzDetailsCheckComponent } from '../cardz-details-check/cardz-details-check.component';

@Component({
  selector: 'app-lab-dashboard',
  imports: [...commonImports,
    CardzDetailsCheckComponent,
    ScrolldDirective, DashboardTasksComponent, AppointmentUiComponent],
  templateUrl: './lab-dashboard.component.html',
  styleUrls: ['../admin-dashboard/admin-dashboard.component.scss', './lab-dashboard.component.scss']
})
export class LabDashboardComponent {
  encounterService = inject(EncounterServiceService);

  takeStock() {
    this.encounterService.addInventory();
  }

}
