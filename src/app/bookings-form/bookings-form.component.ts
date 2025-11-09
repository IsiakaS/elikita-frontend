import { Component, inject, model } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { commonImports } from '../shared/table-interface';
import { MatRadioModule } from '@angular/material/radio';
import { DateRange, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { debounceTime, startWith, tap } from 'rxjs'
import { JsonPipe } from '@angular/common';
import { generalFieldsData, IndividualReferenceField, ReferenceDataType } from '../shared/dynamic-forms.interface2';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';

@Component({
  selector: 'app-bookings-form',
  imports: [...commonImports, ReactiveFormsModule,
    MatTimepickerModule, JsonPipe, DynamicFormsV2Component,
    MatRadioModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './bookings-form.component.html',
  styleUrls: ['../create-schedule/create-schedule.component.scss', './bookings-form.component.scss']
})
export class BookingsFormComponent {
  selectedTimeArray = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']


  todaysDate = new Date()
  toUseToday = new Date(this.todaysDate.setHours(0, 0, 0, 0)).toISOString();
  FourDaysFromNow = new Date(this.todaysDate.setDate(this.todaysDate.getDate() + 4)).toISOString();
  selected = model<Date | null>(null);
  http = inject(HttpClient);


  selectDoctorForm?: any;
  ngOnInit() {

    this.http.get("/dummy.json").subscribe((g: any) => {
      this.selectDoctorForm = <IndividualReferenceField>{
        generalProperties: <generalFieldsData>{
          auth: {
            read: 'all',
            write: 'doctor, nurse'
          },
          fieldApiName: 'Doctor',
          fieldName: "Choose A Doctor",
          fieldType: 'IndividualReferenceField',
          inputType: 'text',
          isArray: false,
          isGroup: false,

        },
        data: <ReferenceDataType>['sss$#$ttt'],
      };

    })

  }
}
