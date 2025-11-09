import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips'
import { commonImports } from '../shared/table-interface';
import { map } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-appointment-ui',
  providers: [provideNativeDateAdapter()],
  imports: [MatCardModule, MatDatepickerModule, MatSelectModule, DatePipe, CommonModule, MatTabsModule,
    MatButtonModule, MatChipsModule, ...commonImports],
  templateUrl: './appointment-ui.component.html',
  styleUrls: ['../doctors-dashboard/doctors-dashboard.component.scss', './appointment-ui.component.scss']
})
export class AppointmentUiComponent {
  // an appointment object with appointment start time as key and other details as value having the patient name, status, and appointment type
  appointmentData: any = {
    morningHours: {
      '08:00': { patientName: 'John Doe', status: 'booked', appointmentType: 'checkup' },
      '09:00': { patientName: 'Jane Smith', status: 'pending', appointmentType: 'consultation' },

      '11:00': { patientName: 'Charlie White', status: 'no-show', appointmentType: 'routine' },
      '12:00': { patientName: 'Alice Johnson', status: 'fulfilled', appointmentType: 'follow-up' },
    },
    afternoonHours: {
      // '01:00': { patientName: 'Bob Brown', status: 'proposed', appointmentType: 'emergency' },
      '02:00': { patientName: 'Eve Davis', status: 'arrived', appointmentType: 'surgery' },
      '03:00': { patientName: 'Frank Green', status: 'booked', appointmentType: 'checkup' },
      '04:00': { patientName: 'Grace Lee', status: 'pending', appointmentType: 'consultation' },
      '05:00': { patientName: 'Hank Black', status: 'fulfilled', appointmentType: 'routine' },
    }
  }
  // an array of hours in the morning  am
  morningHours: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00'];
  // an array of hours in the afternoon pm
  afternoonHours: string[] = ['01:00', '02:00', '03:00', '04:00', '05:00'];
  todaysDate = new Date();
  topDates = [
    { date: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { date: new Date(new Date().setDate(new Date().getDate() - 2)) },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 3)) },
    { date: this.todaysDate },
    { date: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)) },
    { date: new Date(new Date().setMonth(new Date().getMonth() + 3)) },
  ];
  tableFilter: Map<string, any[]> = new Map([[
    'status', ['proposed', 'pending', 'booked', 'arrived', 'no-show', 'fulfilled'],
  ],
  ['days', ['Today', 'Tomorrow']]
  ]);

  tableFilterFormControlObject: {
    [key: string]: FormGroup;
  } = {}

  ngOnInit() {
    for (const [key, value] of this.tableFilter) {
      this.tableFilterFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.tableFilterFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }
  }

}
