import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, Optional } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { AdmissionService } from '../admission/add-admission/admission.service';
import { forkJoin, of, sample } from 'rxjs';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, generalFieldsData, SingleCodeField, codeableConceptFromBackEndDataType, CodeableConceptFieldFromBackEnd } from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormGroup } from '@angular/forms';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTab } from '@angular/material/tabs';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-testing-tasks',
  standalone: true,
  imports: [ReactiveFormsModule,

    MatMenuModule,
    MatFormFieldModule, MatButtonModule, MatInputModule,
    MatDatepickerModule, MatSelectModule, CommonModule,
    MatTimepickerModule, MatDividerModule, RouterLink,
    DynamicFormsV2Component, JsonPipe, MatIconModule, MatAutocompleteModule],
  templateUrl: './testing-tasks.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './testing-tasks.component.scss'
})
export class TestingTasksComponent {
  fb = inject(FormBuilder);
  tasksForm?: FormArray;
  // admissionService = inject(AdmissionService);
  g: any;
  get taskFormArray() {
    return this.overallTasksForm?.get(['tasksForm']) as FormArray;
  }

  getElementFromFormArray($index: number) {
    return this.taskFormArray.at($index) as FormGroup;
  }
  http = inject(HttpClient);
  formFields?: any[]
  ngOnInit() {
    // this.admissionService.testDta.subscribe((g: any) => {
    this.http.get("/testDta.json").subscribe((g: any) => {
      this.g = g;



      //  const  taskFormUtility = {
      this.formFields = [
        //groupfield for tasks

        //taskintent, task priority, task status, task code

        //taskdescription -individualfield, textarea
        <IndividualField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskName',
            fieldName: "Task Name",
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: false,
            isGroup: false,
            auth: {
              read: 'all',
              write: 'doct  or, nurse'
            },
          },
        },
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskFocus',
            fieldName: "Task Type",
            fieldLabel: "Type of Task",
            fieldType: 'SingleCodeField',
            inputType: 'select',
            isArray: false,
            isGroup: false,
            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
          },
          data: ['Vital Signs', 'Observation', 'Medication Administration',
            'Lab Test', 'Service Requests',
          ]

        },
        <IndividualField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskDescription',
            fieldName: "Task Description",
            fieldLabel: "Describe the Task",
            fieldType: 'IndividualField',
            inputType: 'textarea',
            isArray: false,
            isGroup: false,
            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
          },
        },
        //task focus

        //subfocus
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskSubFocus',
            fieldName: "Task Sub Focus",
            fieldType: 'SingleCodeField',
            inputType: 'select',
            isArray: false,
            isGroup: false,
            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
          },
          data: [
            ['Vital Signs', ['Blood Pressure', 'Heart Rate', '9279-1$#$Respiratory Rate$#$http://loinc.org', 'Temperature']],

          ]

        },
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskIntent',
            fieldName: "taskIntent",
            fieldType: 'SingleCodeField',
            inputType: 'hidden',
            isHidden: true,
            isArray: false,
            isGroup: false,
            value: 'order',
            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
            // data: g.taskIntent
          },

        },
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskPriority',
            fieldName: "Task Priority",
            fieldType: 'SingleCodeField',
            inputType: 'hidden',
            isArray: false,
            isGroup: false,
            isHidden: true,

            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
            // data: g.taskPriority
          },


        },
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskStatus',
            fieldName: "Task Status",
            fieldType: 'SingleCodeField',
            inputType: 'hidden',
            isHidden: true,
            isArray: false,
            isGroup: false,
            value: 'planned',
            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
            // data: g.taskStatus
          },

        },
        <SingleCodeField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskCode',
            fieldName: "Task Code",
            fieldType: 'SingleCodeField',
            inputType: 'hidden',
            value: "fulfill",
            isHidden: true,
            isArray: false,
            isGroup: false,

            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
            // data: g.taskCode
          },

        },
        //taskName


        <GroupField>{
          generalProperties: <generalFieldsData>{
            fieldApiName: 'taskRecurrenceDateAndTime',
            fieldName: "Task Recurrence Date and Time",
            fieldType: 'SingleCodeField',

            isArray: true,
            isGroup: true,

            auth: {
              read: 'all',
              write: 'doctor, nurse'
            },
          },

          keys: ['recurrencePattern', 'daysOfWeek', 'daysOfMonth',
            'oneTimeDate', 'oneTimeTime', 'startMonth', 'endMonth',
            'throughoutAdmissionPeriodTime',
            'startDate', 'endDate', 'startTime', 'endTime', 'executionDate', 'executionTime '],
          //    [ 'isOneTime', 'isThroughOutAdmissionPeriod', 'startDateTime', 'endDateTime', 'isFortnightly',
          groupFields: {
            'recurrencePattern': <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'recurrencePattern',
                fieldName: "Recurrence Pattern",
                fieldType: 'SingleCodeField',
                inputType: 'select',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                controllingField: [{
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'One Time',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.oneTime'
                },
                {
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'Daily',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.daily'
                },
                {
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'Weekly',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.weekly'
                },
                {
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'Monthly',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.monthly'
                },
                {
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'Yearly',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.yearly'
                },
                {
                  isAControlField: true,
                  dependentFieldVisibilityTriggerValue: 'Daily Throughout Admission Period',
                  controlledFieldDependencyId: 'taskRecurrenceDateAndTime.throughoutAdmissionPeriod'
                }

                ],
              },
              data: ['One Time', 'Daily', 'Daily Throughout Admission Period', 'Weekly', 'Monthly']
            },
            'daysOfWeek': <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'daysOfWeek',
                fieldName: "Days of Week",
                fieldType: 'SingleCodeField',
                inputType: 'select',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.weekly',
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            'daysOfMonth': <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'daysOfMonth',
                fieldName: "Days of Month",
                fieldType: 'SingleCodeField',
                inputType: 'select',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.monthly',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',

              ],
            },
            'startDate': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'startDate',
                fieldName: "Start Date",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.daily, taskRecurrenceDateAndTime.monthly, taskRecurrenceDateAndTime.yearly',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },
            'startTime': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'startTime',
                fieldName: "Start Time",
                fieldType: 'IndividualField',
                inputType: 'time',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.daily, taskRecurrenceDateAndTime.monthly, taskRecurrenceDateAndTime.yearly',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },
            'endDate': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'endDate',
                fieldName: "End Date",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.daily, taskRecurrenceDateAndTime.monthly, taskRecurrenceDateAndTime.yearly',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },
            'endTime': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'endTime',
                fieldName: "End Time",
                fieldType: 'IndividualField',
                inputType: 'time',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.daily, taskRecurrenceDateAndTime.monthly, taskRecurrenceDateAndTime.yearly',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },
            'oneTimeDate': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'oneTimeDate',
                fieldName: "Date",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.oneTime',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },

            },
            'oneTimeTime': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'oneTimeTime',
                fieldName: "Time",
                fieldType: 'IndividualField',
                inputType: 'time',
                isArray: false,
                isGroup: false,
                dependence_id: 'taskRecurrenceDateAndTime.oneTime',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },

            },
            'throughoutAdmissionPeriodTime': <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'throughoutAdmissionPeriodTime',
                fieldName: "Daily Time",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
                value: 'true',
                dependence_id: 'taskRecurrenceDateAndTime.throughoutAdmissionPeriod',

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },

            },

          }

        }

      ]
      //   };
      this.overallTasksForm = this.fb.group({
        tasksForm: this.fb.array([
          this.fb.group({
            taskName: this.fb.control(''),
            taskDescription: this.fb.control(''),
            taskIntent: this.fb.control('order'),
            taskPriority: this.fb.control(''),
            taskStatus: this.fb.control('planned'),
            taskCode: this.fb.control('fulfill'),
            // taskRecurrenceDateAndTime: this.fb.group({
            recurrencePattern: this.fb.control(''),
            daysOfWeek: this.fb.control([]),
            daysOfMonth: this.fb.control([]),
            oneTimeDate: this.fb.control(''),
            oneTimeTime: this.fb.control(''),
            throughoutAdmissionPeriodTime: this.fb.control(''),
            startDate: this.fb.control(''),
            endDate: this.fb.control(''),
            startTime: this.fb.control(''),
            endTime: this.fb.control(''),
            startMonth: this.fb.control(''),
            endMonth: this.fb.control(''),
            executionDate: this.fb.control(''),
            executionTime: this.fb.control(''),
            isPeriodInstead: this.fb.control(false),
            isTimeRangeInstead: this.fb.control(false),
            isAnyTimeInstead: this.fb.control(false),
            isOneTimeInstead: this.fb.control(true),
            // })
          })
        ])
      })
    }
    );
  }
  overallTasksForm?: FormGroup
  cd = inject(ChangeDetectorRef);

  setToAnyTime(taski: FormGroup, fieldName: string) {
    ['isTimeRangeInstead',
      'isPeriodInstead', 'isOneTimeInstead', 'isAnyTimeInstead'

    ].forEach((field) => {
      taski.get([field])?.setValue(false);
    })
    taski.get([fieldName])?.setValue(true);
    setTimeout(() => {

      this.cd.detectChanges();
    }, 0);

  }

  addTasks() {
    this.taskFormArray.push(this.fb.group({
      taskName: this.fb.control(''),
      taskDescription: this.fb.control(''),
      taskIntent: this.fb.control('order'),
      taskPriority: this.fb.control(''),
      taskStatus: this.fb.control('planned'),
      taskCode: this.fb.control('fulfill'),
      // taskRecurrenceDateAndTime: this.fb.group({
      recurrencePattern: this.fb.control(''),
      daysOfWeek: this.fb.control([]),
      daysOfMonth: this.fb.control([]),
      oneTimeDate: this.fb.control(''),
      oneTimeTime: this.fb.control(''),
      throughoutAdmissionPeriodTime: this.fb.control(''),
      startDate: this.fb.control(''),
      endDate: this.fb.control(''),
      startTime: this.fb.control(''),
      endTime: this.fb.control(''),
      startMonth: this.fb.control(''),
      endMonth: this.fb.control(''),
      executionDate: this.fb.control(''),
      executionTime: this.fb.control(''),
      isPeriodInstead: this.fb.control(false),
      isTimeRangeInstead: this.fb.control(false),
      isAnyTimeInstead: this.fb.control(false),
      isOneTimeInstead: this.fb.control(true),
      // })
    }));

    setTimeout(() => {
      this.cd.detectChanges();
    }, 0)
  }
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, @Optional() public dref: MatDialogRef<TestingTasksComponent>) {


  }

  saveTasks() {
    if (this.dref) {
      this.dref.close(this.taskFormArray.value);
    }
  }
}
