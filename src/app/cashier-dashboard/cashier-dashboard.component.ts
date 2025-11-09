import { Component } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { FormControl } from '@angular/forms';
import { ScrolldDirective } from '../scrolld.directive';
import { PriceFormatPipe } from "../shared/price-format.pipe";
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';

@Component({
  selector: 'app-cashier-dashboard',
  imports: [...commonImports, ScrolldDirective, PriceFormatPipe, MatTooltipModule, AppointmentUiComponent],
  templateUrl: './cashier-dashboard.component.html',
  styleUrls: ['../admin-dashboard/admin-dashboard.component.scss', './cashier-dashboard.component.scss']
})
export class CashierDashboardComponent {
  todayAppointSelect = new FormControl("Remaining");
}
