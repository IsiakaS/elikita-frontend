import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, Optional } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { StateService } from '../shared/state.service';
import { backendEndPointToken } from '../app.config';
import { firstValueFrom } from 'rxjs';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-testing-tasks',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule,

    MatMenuModule,
    MatFormFieldModule, MatButtonModule, MatInputModule,
    MatDatepickerModule, MatSelectModule, CommonModule,
    MatTimepickerModule, MatDividerModule, MatTooltipModule, RouterLink,
    JsonPipe, MatIconModule, MatAutocompleteModule],
  templateUrl: './testing-tasks.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './testing-tasks.component.scss'
})
export class TestingTasksComponent {
  fb = inject(FormBuilder);
  errorService = inject(ErrorService);
  dialog = inject(MatDialog);
  stateService = inject(StateService);
  http = inject(HttpClient);
  private readonly backendUrl = inject(backendEndPointToken);
  tasksForm?: FormArray;
  // admissionService = inject(AdmissionService);
  g: any;

  // Track existing service requests for current patient
  existingServiceRequests: any[] = [];
  loadingServiceRequests = false;
  get taskFormArray() {
    return this.overallTasksForm?.get(['tasksForm']) as FormArray;
  }

  getElementFromFormArray($index: number) {
    return this.taskFormArray.at($index) as FormGroup;
  }
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
            inputType: 'hidden',
            isHidden: true,
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

          keys: ['recurrencePattern', 'oneTimeDate', 'daysOfWeek', 'daysOfMonth',
            'startMonth', 'endMonth', 'startDate', 'endDate',
            'throughoutAdmissionPeriodTime', 'startTime', 'endTime',
            'executionDate', 'executionTime', 'oneTimeTime', 'taskDuration'],
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
              data: ['One Time', 'Daily', 'Weekly', 'Monthly']
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
            'taskDuration': <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'taskDuration',
                fieldName: "Expected Duration",
                fieldLabel: "How long will this task take?",
                fieldType: 'IndividualField',
                inputType: 'text',
                isArray: false,
                isGroup: false,
                placeholder: 'e.g., 15 minutes, 1 hour, 30 mins',

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
            taskFocus: this.fb.control(''),
            taskIntent: this.fb.control('order'),
            taskPriority: this.fb.control(''),
            taskStatus: this.fb.control('planned'),
            taskCode: this.fb.control('fulfill'),
            // taskRecurrenceDateAndTime: this.fb.group({
            recurrencePattern: this.fb.control(''),
            daysOfWeek: this.fb.control([]),
            daysOfMonth: this.fb.control([]),
            oneTimeDate: this.fb.control(''),
            // Convert oneTimeTime to FormArray to support multiple times per task
            oneTimeTime: this.fb.array([
              this.createTimeEntryGroup()
            ]),
            throughoutAdmissionPeriodTime: this.fb.control(''),
            startDate: this.fb.control(''),
            endDate: this.fb.control(''),
            startTime: this.fb.control(''),
            endTime: this.fb.control(''),
            startMonth: this.fb.control(''),
            endMonth: this.fb.control(''),
            executionDate: this.fb.control(''),
            executionTime: this.fb.control(''),
            taskDuration: this.fb.control(''),
            // Remove these as they'll be per time entry now
            // isPeriodInstead: this.fb.control(false),
            // isTimeRangeInstead: this.fb.control(false),
            // isAnyTimeInstead: this.fb.control(false),
            // isOneTimeInstead: this.fb.control(true),
            // })
          })
        ])
      })
    }
    );
  }

  /**
   * Creates a single time entry group with its own mode flags
   */
  createTimeEntryGroup(): FormGroup {
    return this.fb.group({
      timeValue: this.fb.control(''), // Stores the actual time value
      isPeriodInstead: this.fb.control(false),
      isTimeRangeInstead: this.fb.control(false),
      isAnyTimeInstead: this.fb.control(false),
      isOneTimeInstead: this.fb.control(true),
    });
  }

  /**
   * Get the oneTimeTime FormArray for a specific task
   */
  getTimeEntriesArray(taskIndex: number): FormArray {
    return this.taskFormArray.at(taskIndex).get(['oneTimeTime']) as FormArray;
  }

  /**
   * Add a new time entry to a task
   */
  addTimeEntry(taskIndex: number) {
    const timeArray = this.getTimeEntriesArray(taskIndex);
    timeArray.push(this.createTimeEntryGroup());

    setTimeout(() => {
      this.cd.detectChanges();
    }, 0);
  }

  /**
   * Remove a time entry from a task
   */
  removeTimeEntry(taskIndex: number, timeIndex: number) {
    const timeArray = this.getTimeEntriesArray(taskIndex);
    if (timeArray.length > 1) {
      timeArray.removeAt(timeIndex);
    }

    setTimeout(() => {
      this.cd.detectChanges();
    }, 0);
  }

  /**
   * Check if "Any Time" option should be available
   * Only available when there's exactly one time entry
   */
  canUseAnyTime(taskIndex: number): boolean {
    const timeArray = this.getTimeEntriesArray(taskIndex);
    return timeArray.length === 1;
  }
  overallTasksForm?: FormGroup
  cd = inject(ChangeDetectorRef);

  /**
   * Set the time mode for a specific time entry
   */
  setTimeMode(timeEntryGroup: FormGroup, fieldName: string) {
    ['isTimeRangeInstead', 'isPeriodInstead', 'isOneTimeInstead', 'isAnyTimeInstead'].forEach((field) => {
      timeEntryGroup.get([field])?.setValue(false);
    });
    timeEntryGroup.get([fieldName])?.setValue(true);

    // Set the appropriate value for timeValue based on which option is selected
    if (fieldName === 'isAnyTimeInstead') {
      timeEntryGroup.get(['timeValue'])?.setValue('Any Time During The Day');
      timeEntryGroup.get(['timeValue'])?.disable(); // Disable the control
    } else if (fieldName === 'isOneTimeInstead' || fieldName === 'isTimeRangeInstead') {
      // Clear the value for time picker or time range (will be set by user input)
      timeEntryGroup.get(['timeValue'])?.setValue('');
      timeEntryGroup.get(['timeValue'])?.enable(); // Enable the control
    } else if (fieldName === 'isPeriodInstead') {
      timeEntryGroup.get(['timeValue'])?.enable(); // Enable the control for period selection
    }

    setTimeout(() => {
      this.cd.detectChanges();
    }, 0);
  }

  // Keep old method for backward compatibility, but mark as deprecated
  setToAnyTime(taski: FormGroup, fieldName: string) {
    ['isTimeRangeInstead',
      'isPeriodInstead', 'isOneTimeInstead', 'isAnyTimeInstead'

    ].forEach((field) => {
      taski.get([field])?.setValue(false);
    })
    taski.get([fieldName])?.setValue(true);

    // Set the appropriate value for oneTimeTime based on which option is selected
    if (fieldName === 'isAnyTimeInstead') {
      taski.get(['oneTimeTime'])?.setValue('Any Time During The Day');
      taski.get(['oneTimeTime'])?.disable(); // Disable the control
    } else if (fieldName === 'isOneTimeInstead' || fieldName === 'isTimeRangeInstead') {
      // Clear the value for time picker or time range (will be set by user input)
      taski.get(['oneTimeTime'])?.setValue('');
      taski.get(['oneTimeTime'])?.enable(); // Enable the control
    } else if (fieldName === 'isPeriodInstead') {
      taski.get(['oneTimeTime'])?.enable(); // Enable the control for period selection
    }

    setTimeout(() => {

      this.cd.detectChanges();
    }, 0);

  }

  /**
   * Updates the timeValue when the 'from' time changes in a time range
   */
  updateTimeRangeFrom(timeEntryGroup: FormGroup, newFromValue: string) {
    const isoValue = newFromValue ? new Date(newFromValue).toISOString() : newFromValue;
    console.log('updateTimeRangeFrom called with:', isoValue);
    const currentToValue = this.getTimeRangeTo(timeEntryGroup);
    console.log('Current To value:', currentToValue);

    if (isoValue && currentToValue) {
      const rangeValue = `${isoValue}$#$${currentToValue}`;
      console.log('Setting range value:', rangeValue);
      timeEntryGroup.get(['timeValue'])?.setValue(rangeValue);
    } else if (isoValue) {
      // Store just the from value temporarily
      console.log('Only from value, storing temporarily');
      timeEntryGroup.get(['timeValue'])?.setValue(`${isoValue}$#$`);
    }
  }

  /**
   * Updates the timeValue when the 'to' time changes in a time range
   */
  updateTimeRangeTo(timeEntryGroup: FormGroup, newToValue: string) {
    const isoValue = newToValue ? new Date(newToValue).toISOString() : newToValue;
    console.log('updateTimeRangeTo called with:', isoValue);
    const currentFromValue = this.getTimeRangeFrom(timeEntryGroup);
    console.log('Current From value:', currentFromValue);

    if (currentFromValue && isoValue) {
      const rangeValue = `${currentFromValue}$#$${isoValue}`;
      console.log('Setting range value:', rangeValue);
      timeEntryGroup.get(['timeValue'])?.setValue(rangeValue);
    } else if (isoValue) {
      // Store just the to value temporarily
      console.log('Only to value, storing temporarily');
      timeEntryGroup.get(['timeValue'])?.setValue(`$#$${isoValue}`);
    }
  }

  /**
   * Gets the 'from' time from the timeValue (format: "ISO$#$ISO")
   */
  getTimeRangeFrom(timeEntryGroup: FormGroup): string {
    const value = timeEntryGroup.get(['timeValue'])?.value || '';
    console.log('getTimeRangeFrom - raw value:', value);
    if (value && value.includes('$#$')) {
      const fromTime = value.split('$#$')[0];
      console.log('getTimeRangeFrom - returning:', fromTime);
      return fromTime;
    }
    console.log('getTimeRangeFrom - returning empty');
    return '';
  }

  /**
   * Gets the 'to' time from the timeValue (format: "ISO$#$ISO")
   */
  getTimeRangeTo(timeEntryGroup: FormGroup): string {
    const value = timeEntryGroup.get(['timeValue'])?.value || '';
    console.log('getTimeRangeTo - raw value:', value);
    if (value && value.includes('$#$')) {
      const toTime = value.split('$#$')[1];
      console.log('getTimeRangeTo - returning:', toTime);
      return toTime;
    }
    console.log('getTimeRangeTo - returning empty');
    return '';
  }

  addTasks() {
    this.taskFormArray.push(this.fb.group({
      taskName: this.fb.control(''),
      taskDescription: this.fb.control(''),
      taskFocus: this.fb.control(''),
      taskIntent: this.fb.control('order'),
      taskPriority: this.fb.control(''),
      taskStatus: this.fb.control('planned'),
      taskCode: this.fb.control('fulfill'),
      // taskRecurrenceDateAndTime: this.fb.group({
      recurrencePattern: this.fb.control(''),
      daysOfWeek: this.fb.control([]),
      daysOfMonth: this.fb.control([]),
      oneTimeDate: this.fb.control(''),
      oneTimeTime: this.fb.array([
        this.createTimeEntryGroup()
      ]),
      throughoutAdmissionPeriodTime: this.fb.control(''),
      startDate: this.fb.control(''),
      endDate: this.fb.control(''),
      startTime: this.fb.control(''),
      endTime: this.fb.control(''),
      startMonth: this.fb.control(''),
      endMonth: this.fb.control(''),
      executionDate: this.fb.control(''),
      executionTime: this.fb.control(''),
      taskDuration: this.fb.control(''),
      // Removed - these are now per time entry
      // isPeriodInstead: this.fb.control(false),
      // isTimeRangeInstead: this.fb.control(false),
      // isAnyTimeInstead: this.fb.control(false),
      // isOneTimeInstead: this.fb.control(true),
      // })
    }));

    setTimeout(() => {
      this.cd.detectChanges();
    }, 0)
  }

  /**
   * Validates the entire tasks form before submission
   * Returns an object with isValid boolean and errors array
   */
  validateTasksForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const tasksArray = this.taskFormArray;

    if (!tasksArray || tasksArray.length === 0) {
      errors.push('At least one task is required.');
      return { isValid: false, errors };
    }

    // Validate each task
    tasksArray.controls.forEach((taskControl, taskIndex) => {
      const task = taskControl as FormGroup;
      const taskNumber = taskIndex + 1;
      const recurrencePattern = task.get(['recurrencePattern'])?.value?.trim();

      // Basic field validation
      const taskName = task.get(['taskName'])?.value?.trim();
      if (!taskName) {
        errors.push(`Task ${taskNumber}: Task name is required.`);
      }

      if (!recurrencePattern) {
        errors.push(`Task ${taskNumber}: Recurrence pattern is required.`);
        return; // Skip further validation if no recurrence pattern
      }

      // Step 1: Validate required fields based on recurrence pattern
      switch (recurrencePattern) {
        case 'One Time':
          const oneTimeDate = task.get(['oneTimeDate'])?.value;
          if (!oneTimeDate) {
            errors.push(`Task ${taskNumber}: Date is required for "One Time" tasks.`);
          }
          break;

        case 'Weekly':
          const daysOfWeek = task.get(['daysOfWeek'])?.value;
          const weeklyStartDate = task.get(['startDate'])?.value;
          const weeklyEndDate = task.get(['endDate'])?.value;

          if (!daysOfWeek || (Array.isArray(daysOfWeek) && daysOfWeek.length === 0)) {
            errors.push(`Task ${taskNumber}: Day of week is required for "Weekly" tasks.`);
          }
          if (!weeklyStartDate) {
            errors.push(`Task ${taskNumber}: Start date is required for "Weekly" tasks.`);
          }
          if (!weeklyEndDate) {
            errors.push(`Task ${taskNumber}: End date is required for "Weekly" tasks.`);
          }
          break;

        case 'Monthly':
          const daysOfMonth = task.get(['daysOfMonth'])?.value;
          const startMonth = task.get(['startMonth'])?.value;
          const endMonth = task.get(['endMonth'])?.value;

          if (!daysOfMonth || (Array.isArray(daysOfMonth) && daysOfMonth.length === 0)) {
            errors.push(`Task ${taskNumber}: Day of month is required for "Monthly" tasks.`);
          }
          if (!startMonth) {
            errors.push(`Task ${taskNumber}: Start month is required for "Monthly" tasks.`);
          }
          if (!endMonth) {
            errors.push(`Task ${taskNumber}: End month is required for "Monthly" tasks.`);
          }
          break;

        case 'Daily':
          const dailyStartDate = task.get(['startDate'])?.value;
          const dailyEndDate = task.get(['endDate'])?.value;

          if (!dailyStartDate) {
            errors.push(`Task ${taskNumber}: Start date is required for "Daily" tasks.`);
          }
          if (!dailyEndDate) {
            errors.push(`Task ${taskNumber}: End date is required for "Daily" tasks.`);
          }
          break;

        case 'Daily Throughout Admission Period':
          const admissionTime = task.get(['throughoutAdmissionPeriodTime'])?.value;
          if (!admissionTime) {
            errors.push(`Task ${taskNumber}: Time is required for "Daily Throughout Admission Period" tasks.`);
          }
          break;
      }

      // Step 2: Validate time entries array
      const timeEntriesArray = task.get(['oneTimeTime']) as FormArray;

      if (!timeEntriesArray || timeEntriesArray.length === 0) {
        errors.push(`Task ${taskNumber}: At least one time entry is required.`);
      } else {
        // Validate each time entry
        timeEntriesArray.controls.forEach((timeEntryControl, timeIndex) => {
          const timeEntry = timeEntryControl as FormGroup;
          const timeNumber = timeIndex + 1;
          const timeValue = timeEntry.get(['timeValue'])?.value;
          const isAnyTime = timeEntry.get(['isAnyTimeInstead'])?.value;

          // Skip validation for "Any Time" option
          if (isAnyTime && timeValue === 'Any Time During The Day') {
            return;
          }

          // Check if timeValue exists and is not empty
          // Handle different data types (string, Date object, etc.)
          const isEmpty = !timeValue ||
            (typeof timeValue === 'string' && timeValue.trim() === '') ||
            (typeof timeValue === 'object' && timeValue === null);

          if (isEmpty) {
            errors.push(`Task ${taskNumber}, Time ${timeNumber}: Time value is required.`);
          } else {
            // Additional validation based on time mode
            const isTimeRange = timeEntry.get(['isTimeRangeInstead'])?.value;
            const timeValueStr = typeof timeValue === 'string' ? timeValue : String(timeValue);

            if (isTimeRange) {
              // Time range should have the format "ISO$#$ISO"
              if (!timeValueStr.includes('$#$')) {
                errors.push(`Task ${taskNumber}, Time ${timeNumber}: Invalid time range format.`);
              } else {
                const [fromTime, toTime] = timeValueStr.split('$#$');
                if (!fromTime || !toTime) {
                  errors.push(`Task ${taskNumber}, Time ${timeNumber}: Both "from" and "to" times are required for time range.`);
                }
              }
            }
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, @Optional() public dref: MatDialogRef<TestingTasksComponent>) {


  }

  /**
   * Fetch active service requests for the current patient
   */
  private async fetchActiveServiceRequests(): Promise<any[]> {
    const patientId = await firstValueFrom(this.stateService.currentPatientId$);

    if (!patientId) {
      console.error('No patient ID available');
      return [];
    }

    this.loadingServiceRequests = true;

    try {
      const url = `${this.backendUrl}/ServiceRequest?patient=${patientId}&status=active&_sort=-_lastUpdated`;
      const bundle: any = await firstValueFrom(this.http.get(url));

      const serviceRequests = bundle?.entry?.map((entry: any) => entry.resource) || [];
      console.log('Fetched active service requests:', serviceRequests);

      this.loadingServiceRequests = false;
      return serviceRequests;
    } catch (error) {
      console.error('Error fetching service requests:', error);
      this.loadingServiceRequests = false;
      return [];
    }
  }

  /**
   * Opens a menu to choose between selecting existing service requests or creating a new one
   * @param taskIndex - The index of the task to add the service request to
   */
  async openTaskDetailsMenu(taskIndex: number, event: MouseEvent) {
    // Prevent default button behavior
    event.stopPropagation();

    // Fetch active service requests
    this.existingServiceRequests = await this.fetchActiveServiceRequests();

    // Create menu options based on available service requests
    const hasExistingRequests = this.existingServiceRequests.length > 0;

    // For now, we'll just show which option would be available
    // You can implement a proper menu component or dialog
    console.log('Has existing service requests:', hasExistingRequests);
    console.log('Existing requests count:', this.existingServiceRequests.length);
  }

  /**
   * Opens dialog to select from existing active service requests
   * @param taskIndex - The index of the task
   */
  openSelectExistingServiceRequest(taskIndex: number) {
    if (this.existingServiceRequests.length === 0) {
      this.errorService.openandCloseError('No active lab tests or procedures found for this patient.');
      return;
    }

    // Transform service requests into reference field format
    const serviceRequestReferences = this.existingServiceRequests.map(sr => ({
      reference: `ServiceRequest/${sr.id}`,
      display: sr.code?.text || sr.code?.coding?.[0]?.display || `Service Request ${sr.id}`
    }));

    // Create a simple dialog using dynamic forms for selection
    // import('../shared/dynamic-forms-v2/dynamic-forms-v2.component').then(m => {
    const dialogRef = this.dialog.open(DynamicFormsV2Component, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        formFields: [
          <IndividualReferenceField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'serviceRequest',
              fieldName: "Select Lab Test or Procedure",
              fieldLabel: "Choose from existing orders",
              fieldType: 'IndividualReferenceField',
              inputType: 'select',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
            data: serviceRequestReferences
          }
        ],
        formMetaData: {
          formName: 'Select Existing Order',
          formDescription: 'Choose from active lab tests or procedures for this patient'
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.serviceRequest) {
        // Store the selected service request reference in the task
        const task = this.taskFormArray.at(taskIndex);
        task.get(['taskFocus'])?.setValue(result.serviceRequest);
        console.log('Selected service request:', result.serviceRequest);
      }
    });
    // });
  }

  /**
   * Opens the lab request dialog to add a new service request
   * @param taskIndex - The index of the task to add the service request to
   */
  ecServ = inject(EncounterServiceService);
  async openAddNewServiceRequest(taskIndex: number) {
    this.ecServ.addServiceRequest(await firstValueFrom(this.stateService.currentPatientId$), null,)
    //   const dialogRef = this.dialog.open(m.LabRequestsComponent, {
    //     width: '800px',
    //     maxWidth: '95vw',
    //     data: {
    //       mode: 'add',
    //       taskIndex: taskIndex
    //     }
    //   });

    //   dialogRef.afterClosed().subscribe(result => {
    //     if (result) {
    //       // Handle the service request result
    //       // You can store the service request reference in the task
    //       const task = this.taskFormArray.at(taskIndex);
    //       task.get(['taskFocus'])?.setValue('Service Requests');
    //       console.log('New service request created:', result);
    //     }
    //   });
    // });
  }

  taskSubmissionResult: any;
  saveTasks() {
    // Validate the form before submission
    const validation = this.validateTasksForm();

    if (!validation.isValid) {
      // Show all validation errors using ErrorService
      const errorList = validation.errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
      const errorMessage = `Please fix the following errors:\n\n${errorList}`;

      this.errorService.openandCloseError(errorMessage);
      console.error('Validation errors:', validation.errors);
      return;
    }

    // If validation passes, proceed with submission
    this.http.post(`http://localhost:3000/api/tasks/submit`, this.overallTasksForm?.value).subscribe({
      next: (res) => {
        this.taskSubmissionResult = res;
        if (this.dref) {
          this.dref.close(this.taskSubmissionResult);
        }
      },
      error: (err) => {
        console.error('Submission error:', err);
        this.errorService.openandCloseError('Failed to submit tasks. Please try again.');
      }
    });
  }

}
