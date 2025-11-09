import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { commonImports } from '../shared/table-interface';
import { MatRadioModule } from '@angular/material/radio';
import { DateRange, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { debounceTime, startWith, tap } from 'rxjs'
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-create-schedule',
  imports: [...commonImports, ReactiveFormsModule,
    MatTimepickerModule, JsonPipe,
    MatRadioModule, MatDatepickerModule],
  templateUrl: './create-schedule.component.html',
  styleUrl: './create-schedule.component.scss',
  providers: [provideNativeDateAdapter()]
})
export class CreateScheduleComponent {

  fb = inject(FormBuilder);
  scheduleForm?: FormGroup;
  subGroupsVisibility = {
    'date': true,
    'dateRecurrence': false,
    'time': false,
    'timeRecurrence': false
  }
  setValue(event: any, e: AbstractControl) {
    console.log(event)
  }
  constructor() {

    this.scheduleForm = this.fb.group({
      title: [''],
      date: this.fb.group({
        start: [''],
        end: this.fb.group({
          type: ['specific_date'],
          value: ['']
        })
      }),
      time: this.fb.group({
        start: [''],
        end: this.fb.group({
          type: [''],
          value: ['']
        })
      }),
      dateRecurrence: this.fb.group({
        type: [''],
        value: [''] // Assuming you want to manage recurrence as an array
      }),
      timeRecurrence: this.fb.group({
        type: ['default'],
        value: ['', Validators.minLength(2)] // Assuming you want to manage recurrence as an array
      }),

    });
    // Assuming you want to manage participants as an array

  }


  ngOnInit() {
    this.scheduleForm?.get(['date', 'end', 'value'])?.valueChanges.pipe(
      startWith(""),
      tap((e: any) => {
        // alert("nada")
        if (this.scheduleForm?.get(['date', 'start'])?.value) {
          this.selectedDateArray = new DateRange(this.scheduleForm?.get(['date', 'start'])?.value, e)
          // this.turnStartandEndDateIntoDateArray(this.scheduleForm?.get(['date', 'start'])?.value, e);
        }


      })).subscribe((e: any) => {

      })

    this.scheduleForm?.get(['date', 'start'])?.valueChanges.pipe(
      startWith(""),
      tap((e: any) => {
        // alert("nada")
        if (this.scheduleForm?.get(['date', 'end', 'value'])?.value) {
          this.selectedDateArray = new DateRange(e, this.scheduleForm?.get(['date', 'end', 'value'])?.value)
          // this.turnStartandEndDateIntoDateArray(this.scheduleForm?.get(['date', 'start'])?.value, e);
        }


      })).subscribe((e: any) => {

      })

    this.scheduleForm?.get(['timeRecurrence', 'value'])?.valueChanges.pipe(
      debounceTime(2000),
      startWith(""),
      tap((e: any) => {
        if (this.scheduleForm?.get(['timeRecurrence', 'value'])?.valid) {
          // alert("nada")
          if (this.scheduleForm?.get(['time', 'start'])?.value &&
            this.scheduleForm?.get(['time', 'end', 'value'])?.value
          ) {
            this.turnTimeIntoArray(
              e,

              this.scheduleForm?.get(['time', 'start'])?.value,
              this.scheduleForm?.get(['time', 'end', 'value'])?.value,

            );
          }
        }

      })).subscribe((e: any) => {

      })
  }

  turnStartandEndDateIntoDateArray(startDate: string, endDate: string) {

    let sD = new Date(startDate).getTime();
    const eD = new Date(endDate).getTime();
    const dateArray = [new Date(sD).toISOString()]
    const twentyFourHours = 1000 * 60 * 60 * 24;
    while (sD + twentyFourHours <= eD) {
      sD += twentyFourHours;
      dateArray.push(new Date(sD).toISOString())
    }

    this.selectedDateArray = dateArray
    console.log(this.selectedDateArray);

  }
  turnTimeIntoArray(recurrence: any, startDate: string, endDate: string) {

    let sD = +(new Date(startDate).getTime());
    const eD = new Date(endDate).getTime();
    const timeArray = [new Date(sD).getHours().toString().padStart(2, '0') + ":" + new Date(sD).getMinutes().toString().padStart(2, '0')]
    let recurrenceNumber = +recurrence
    const selectedMinutes = 1000 * 60 * recurrenceNumber;
    while (sD + selectedMinutes < eD) {
      sD += selectedMinutes;
      timeArray.push(new Date(sD).getHours().toString().padStart(2, '0') + ":" + new Date(sD).getMinutes().toString().padStart(2, '0'))
    }
    this.selectedTimeArray = timeArray
    console.log(this.selectedTimeArray)
  }
  selectedDateArray?: any
  selectedTimeArray?: any

}
