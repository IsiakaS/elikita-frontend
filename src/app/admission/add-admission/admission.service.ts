import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, forkJoin, of, sample } from 'rxjs';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, generalFieldsData, SingleCodeField, codeableConceptFromBackEndDataType, CodeableConceptFieldFromBackEnd } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { AddAdmissionComponent } from './add-admission.component';
import { AdmissionComponent } from '../admission.component';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {

  /**
 * === Patient Admission Summary ===
 * - Encounter must already exist from outpatient visit.
 * - On admission, update Encounter.status to "in-progress" and class to "inpatient".
 * - Set Encounter.location to a chosen Location (e.g., ward/bed) using a reference.
 * - Allow adding a CarePlan (optional) during admission:
 *    - CarePlan can contain multiple Task resources.
 *    - Each Task may focus on:
 *        - Observation (e.g., vital signs)
 *        - ServiceRequest (e.g., lab test)
 *        - MedicationRequest (e.g., IV drugs)
 *    - Task includes: executionPeriod, performer (practitioner), and recurrence.
 *    - Recurring tasks are saved as separate Task resources.
 * - Location data (bed, room, ward) must be predefined by admin via Location resource.
 * - CarePlan and Tasks are optional but follow FHIR linkage conventions.
 */
  admissionFormFields?: {
    [key: string]: {
      formMetaData?: formMetaData,
      formFields: FormFields[]
    }
  }
  admissionFormMetaData?: formMetaData
  constructor() { }
  formfieldService = inject(FormFieldsSelectDataService);
  testDta = new BehaviorSubject({});

  addAddmissionForm() {
    forkJoin({
      'location': this.formfieldService.getFormFieldSelectData('admission', 'location'),
      'ward': this.formfieldService.getFormFieldSelectData('admission', 'ward'),
      'room': this.formfieldService.getFormFieldSelectData('admission', 'room'),
      'bed': this.formfieldService.getFormFieldSelectData('admission', 'bed'),
      'admitSource': this.formfieldService.getFormFieldSelectData('admission', 'admitSource'),
      'carePlanStatus': this.formfieldService.getFormFieldSelectData('admission', 'carePlanStatus'),
      'carePlanIntent': this.formfieldService.getFormFieldSelectData('admission', 'carePlanIntent'),
      'admissionReason': this.formfieldService.getFormFieldSelectData('encounter', 'reason'),
      //taskintent, task priority, task status, task code
      'taskIntent': this.formfieldService.getFormFieldSelectData('admission', 'taskIntent'),
      'taskPriority': this.formfieldService.getFormFieldSelectData('admission', 'taskPriority'),
      'taskStatus': this.formfieldService.getFormFieldSelectData('admission', 'taskStatus'),
      'taskCode': this.formfieldService.getFormFieldSelectData('admission', 'taskCode')



    }).subscribe({

      next: (g) => {
        this.testDta.next(g);
        // Handle successful responses
        this.admissionFormMetaData = {
          formName: "Patient Admission",
          formDescription: "Admission of a patient to the hospital for inpatient care.",


        }

        this.admissionFormFields = {
          'encounter': {
            formMetaData: <formMetaData>{
              formName: "Patient Admission",
              formDescription: "Admission of a patient to the hospital for inpatient care.",

            },
            formFields: [
              <CodeableConceptFieldFromBackEnd>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'reason',
                  fieldName: "Reason For Admission",
                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.admissionReason
              },
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'encounterIdToUpdate',
                  fieldName: "Encounter ID to Update",
                  fieldType: 'IndividualField',
                  inputType: 'hidden',
                  isHidden: true,
                  value: '',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
              },
              // encounter status to in-progress
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'encounterStatus',
                  fieldName: "Encounter Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'select',
                  value: 'in-progress',
                  isHidden: true,
                  isArray: false,
                  isGroup: false,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: 'in-progress | finished | cancelled | on-hold | unknown | entered-in-error | planned | triaged | arrived | waitlist | in-progress | onleave'.split(' | ')
              },
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'encounterClass',
                  fieldName: "Encounter Class",
                  fieldType: 'SingleCodeField',
                  inputType: 'select',
                  value: 'inpatient',
                  isArray: false,
                  isHidden: true,
                  isGroup: false,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: 'inpatient | outpatient | ambulatory | emergency | virtual | home | field | daytime | public-health | other'.split(' | ')
              },
              // subjectstatus to admitted
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'subjectStatus',
                  fieldName: "Subject Status",
                  fieldType: 'CodeableConceptField',
                  inputType: 'hidden',
                  isHidden: true,
                  value: 'admitted',
                  isArray: false,
                  isGroup: false,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: ['admitted', 'discharged', 'transferred', 'expired', 'unknown']
              },
              //admission.admitsource with a prevalue of outpatient - a codeable concept field
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'admission.admitSource',
                  fieldName: "Admission Source",
                  fieldType: 'CodeableConceptField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  value: "From Outpatient Department",
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.admitSource
              },

            ]
          },
          'location': {
            formFields: [
              <IndividualReferenceField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'location.ward',
                  fieldName: "Ward",
                  fieldType: 'IndividualReferenceField',
                  inputType: 'select',
                  value: '',
                  isArray: false,
                  isGroup: false,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.ward
              },
              <IndividualReferenceField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'location.room',
                  fieldName: "Room",
                  fieldType: 'IndividualReferenceField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.room
              },
              <IndividualReferenceField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'location.bed',
                  fieldName: "Bed",
                  fieldType: 'IndividualReferenceField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.bed
              },

            ]
          },
          'carePlan': {
            formFields: [
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'intent',
                  fieldName: "Intent",
                  fieldType: 'SingleCodeField',
                  value: 'order',

                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.carePlanIntent
              },
              // status of care plan
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'status',
                  fieldName: "Status",
                  fieldType: 'SingleCodeField',
                  value: 'active',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.carePlanStatus
              },
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'title',
                  fieldName: "Tite",
                  fieldLabel: "Give Your Plan A Title",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
              },
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'description',
                  fieldName: "Description",
                  fieldLabel: "Describe Your Care Plan",
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

            ]
          },
          'tasks': {
            formFields: [
              //groupfield for tasks

              //taskintent, task priority, task status, task code

              //taskdescription -individualfield, textarea
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
                  data: g.taskIntent
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
                  data: g.taskPriority
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
                  data: g.taskStatus
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
                  data: g.taskCode
                },

              },


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

                keys: ['recurrencePattern', 'daysOfWeek',
                  'oneTimeDate', 'oneTimeTime',
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
                    data: ['One Time', 'Daily', 'Daily Throughout Admission Period', 'Weekly', 'Monthly', 'Yearly']
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
          },

        };

        this.dialog.open(AddAdmissionComponent, {
          maxHeight: '90vh',
          maxWidth: '900px',
          data: {
            formMetaData: this.admissionFormMetaData,
            formFieldsToUse: this.admissionFormFields
          },
          panelClass: 'custom-dialog-container',
          // width: '600px',
          height: '90vh',
          autoFocus: false,
          restoreFocus: false,
          disableClose: true,
          hasBackdrop: true,
          // backdropClass: 'custom-backdrop-class',
        })
      },


      error: (err) => {
        // Handle errors
        this.errorService.openandCloseError(err);
      }
    })

  }
  errorService = inject(ErrorService);
  dialog = inject(MatDialog);
}