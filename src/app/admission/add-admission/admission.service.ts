import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, forkJoin, of, sample, tap } from 'rxjs';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, generalFieldsData, SingleCodeField, codeableConceptFromBackEndDataType, CodeableConceptFieldFromBackEnd } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { AddAdmissionComponent } from './add-admission.component';
import { AdmissionComponent } from '../admission.component';
import { HttpClient } from '@angular/common/http';
import { switchMap, catchError } from 'rxjs';
import { StateService } from '../../shared/state.service';
import { Subscription } from 'rxjs';

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
  constructor() {
    this.subscriptions.add(
      this.stateService.currentPatientId$.subscribe(patientId => {
        console.log('🔄 AdmissionService: Patient ID changed to:', patientId);
        this.currentPatientId = patientId;

        // Clear any stale encounter data when patient changes
        if (this.currentEncounter?.subject?.reference) {
          const encounterPatientId = this.currentEncounter.subject.reference.split('/')[1];
          if (encounterPatientId !== patientId) {
            console.log('⚠️ Patient changed - clearing stale encounter');
            this.clearCurrentEncounter();
          }
        }
      })
    );
  }
  formfieldService = inject(FormFieldsSelectDataService);
  testDta = new BehaviorSubject({});

  // Store filtered available locations
  private availableBeds: any[] = [];
  private availableRooms: any[] = [];
  private availableWards: any[] = [];
  stateService = inject(StateService);

  private http = inject(HttpClient);
  private currentEncounter?: any; // Store the encounter being worked on
  // private patientId: string = this.stateService.getCurrentPatient('id') // Store patient ID for encounter queries

  // ✅ NEW: Track subscriptions for cleanup
  private subscriptions = new Subscription();

  // ✅ NEW: Current patient ID (reactive)
  private currentPatientId: string | null = null;

  /**
   * Set the patient ID before opening admission form
   */
  // setPatientId(patientId: string): void {

  //   this.patientId = 
  // }



  addAddmissionForm() {
    // ✅ Use reactive patient ID instead of constructor-cached value
    const patientId = this.currentPatientId;

    if (!patientId) {
      this.errorService.openandCloseError('Patient ID is required to start admission.');
      return;
    }

    console.log('🏥 Opening admission form for patient:', patientId);

    // Query for existing in-progress encounters for this patient
    const encounterSearchUrl = `https://elikita-server.daalitech.com/Encounter?patient=${patientId}&status=in-progress&_sort=-_lastUpdated&_count=1`;

    this.http.get(encounterSearchUrl).pipe(
      tap((bundle: any) => {
        console.log('Encounter search result:', bundle);

        // Check if we found an in-progress encounter
        const entries = bundle?.entry || [];
        if (entries.length > 0) {
          this.currentEncounter = entries[0].resource;
          console.log('Found existing in-progress encounter:', this.currentEncounter);

          // ✅ NEW: Check if this encounter is already an active admission
          if (this.isActiveAdmission(this.currentEncounter)) {
            console.error('🚫 Encounter is already an active admission');

            // Build detailed error message
            const admissionId = this.currentEncounter.hospitalization?.preAdmissionIdentifier?.value || 'Unknown';
            const encounterDate = this.currentEncounter.period?.start
              ? new Date(this.currentEncounter.period.start).toLocaleDateString()
              : 'Unknown date';

            this.errorService.openandCloseError(
              `❌ Cannot create new admission:\n\n` +
              `This patient already has an active admission in progress.\n\n` +
              `Admission Details:\n` +
              `• Admission ID: ${admissionId}\n` +
              `• Encounter ID: ${this.currentEncounter.id}\n` +
              `• Started: ${encounterDate}\n` +
              `• Status: ${this.currentEncounter.status}\n\n` +
              `Please complete or cancel the existing admission before creating a new one.`
            );

            // Clear current encounter and stop execution
            this.currentEncounter = undefined;
            throw new Error('Active admission already exists');
          }
        } else {
          // No in-progress encounter found, create preliminary encounter
          this.currentEncounter = this.createPreliminaryEncounter();
          console.log('Created preliminary encounter:', this.currentEncounter);
        }
      }),
      catchError(err => {
        // Check if error is from active admission check
        if (err.message === 'Active admission already exists') {
          // Don't open form, just return empty observable
          return of(null);
        }

        console.error('Error searching for encounter:', err);
        // On other errors, create preliminary encounter anyway
        this.currentEncounter = this.createPreliminaryEncounter();
        return of(null);
      }),
      switchMap((result) => {
        // ✅ If result is null (active admission exists), don't proceed
        if (result === null && !this.currentEncounter) {
          console.log('⚠️ Stopping admission form opening due to active admission');
          return of(null);
        }

        // Now load form data
        return forkJoin({
          'location': this.formfieldService.getFormFieldSelectData('admission', 'location'),
          'admitSource': this.formfieldService.getFormFieldSelectData('admission', 'admitSource'),
          'carePlanStatus': this.formfieldService.getFormFieldSelectData('admission', 'carePlanStatus'),
          'carePlanIntent': this.formfieldService.getFormFieldSelectData('admission', 'carePlanIntent'),
          'admissionReason': this.formfieldService.getFormFieldSelectData('encounter', 'reason'),
          'taskIntent': this.formfieldService.getFormFieldSelectData('admission', 'taskIntent'),
          'taskPriority': this.formfieldService.getFormFieldSelectData('admission', 'taskPriority'),
          'taskStatus': this.formfieldService.getFormFieldSelectData('admission', 'taskStatus'),
          'taskCode': this.formfieldService.getFormFieldSelectData('admission', 'taskCode')
        });
      })
    ).subscribe({
      next: (g) => {
        // ✅ If g is null (active admission exists), don't open dialog
        if (!g) {
          console.log('⚠️ Skipping dialog open due to active admission');
          return;
        }

        this.testDta.next(g);

        // Filter available beds, rooms, wards
        this.availableBeds = this.filterLocationsByType(g.location, 'bed')
          .filter(bed => this.isLocationAvailable(bed));

        const roomRefsWithBeds = new Set(
          this.availableBeds
            .map(bed => bed.partOf?.reference)
            .filter(Boolean)
        );

        this.availableRooms = this.filterLocationsByType(g.location, 'room')
          .filter(room => {
            const roomRef = `Location/${room.id}`;
            return roomRefsWithBeds.has(roomRef);
          });

        const wardRefsWithRooms = new Set(
          this.availableRooms
            .map(room => room.partOf?.reference)
            .filter(Boolean)
        );

        this.availableWards = this.filterLocationsByType(g.location, 'ward')
          .filter(ward => {
            const wardRef = `Location/${ward.id}`;
            return wardRefsWithRooms.has(wardRef);
          });

        console.log('=== Availability Summary ===');
        console.log('Available beds:', this.availableBeds.length);
        console.log('Rooms with available beds:', this.availableRooms.length);
        console.log('Wards with available rooms:', this.availableWards.length);

        // Build form metadata
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
                  allowedOthers: true,
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
                  value: this.currentEncounter?.id || '', // Pre-fill with encounter ID if exists
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
                data: this.availableWards // Use filtered wards
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
                data: this.availableRooms // Use filtered rooms
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
                data: this.availableBeds // Use filtered beds
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
            formFieldsToUse: this.admissionFormFields,
            currentEncounter: this.currentEncounter // Pass encounter to component
          },
          panelClass: 'custom-dialog-container',
          height: '90vh',
          autoFocus: false,
          restoreFocus: false,
          disableClose: true,
          hasBackdrop: true,
        })
      },
      error: (err) => {
        // Only show error if not from active admission check
        if (err.message !== 'Active admission already exists') {
          this.errorService.openandCloseError('Failed to load admission form data.');
        }
      }
    });
  }

  /**
   * Check if an encounter is an active admission
   * An active admission is defined as:
   * - Encounter status: 'in-progress'
   * - Encounter class.code: 'IMP' (inpatient)
   * - Has hospitalization data with admission details
   * 
   * @param encounter - FHIR Encounter resource
   * @returns true if encounter is an active admission, false otherwise
   */
  private isActiveAdmission(encounter: any): boolean {
    if (!encounter) return false;

    // Check if encounter is in-progress
    const isInProgress = encounter.status === 'in-progress';

    // Check if encounter class is inpatient (IMP)
    const isInpatient = encounter.class?.code?.toUpperCase() === 'IMP' ||
      encounter.class?.display?.toLowerCase().includes('inpatient');

    // Check if hospitalization data exists (indicates admission)
    const hasHospitalization = !!encounter.hospitalization;

    // Additional check: has admission identifier or admit source
    const hasAdmissionIndicators =
      encounter.hospitalization?.preAdmissionIdentifier?.value ||
      encounter.hospitalization?.admitSource ||
      encounter.identifier?.some((id: any) =>
        id.system?.includes('admission-id')
      );

    const isActive = isInProgress && isInpatient && (hasHospitalization || hasAdmissionIndicators);

    if (isActive) {
      console.log('✅ Detected active admission:', {
        encounterId: encounter.id,
        status: encounter.status,
        class: encounter.class,
        admissionId: encounter.hospitalization?.preAdmissionIdentifier?.value,
        hasHospitalization,
        hasAdmissionIndicators
      });
    }

    return isActive;
  }

  /**
   * Create a preliminary encounter with minimal required fields
   */
  private createPreliminaryEncounter(): any {
    const patientId = this.currentPatientId;

    if (!patientId) {
      console.error('Cannot create preliminary encounter: No patient ID available');
      return null;
    }

    const now = new Date().toISOString();

    return {
      resourceType: 'Encounter',
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient encounter'
      },
      subject: {
        reference: `Patient/${patientId}`,
        display: 'Patient' // Will be updated with actual name later
      },
      period: {
        start: now
      },
      statusHistory: [
        {
          status: 'in-progress',
          period: {
            start: now
          }
        }
      ],
      classHistory: [
        {
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'IMP',
            display: 'inpatient encounter'
          },
          period: {
            start: now
          }
        }
      ]
    };
  }

  /**
   * Update encounter with admission details
   * Normalizes encounter to ensure correct admission values
   * ✅ CALLED BEFORE VALIDATION to fix any incorrect pre-filled values
   * @param encounterData - Current encounter object (may have incorrect values)
   * @returns Normalized encounter with correct admission standards
   */
  updateEncounterWithAdmission(encounterData: any): any {
    const now = new Date().toISOString();
    const encounter = this.currentEncounter || {};

    // ✅ FORCE correct status for admission
    encounter.status = 'in-progress';

    // ✅ Initialize or update statusHistory
    if (!encounter.statusHistory) {
      encounter.statusHistory = [];
    }
    // Only add new history entry if status actually changed
    const lastStatus = encounter.statusHistory[encounter.statusHistory.length - 1];
    if (!lastStatus || lastStatus.status !== 'in-progress') {
      encounter.statusHistory.push({
        status: 'in-progress',
        period: {
          start: now
        }
      });
    }

    // ✅ FORCE correct class for inpatient admission
    encounter.class = {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'IMP',
      display: 'inpatient'
    };

    // ✅ Initialize or update classHistory
    if (!encounter.classHistory) {
      encounter.classHistory = [];
    }
    // Only add new history entry if class actually changed
    const lastClass = encounter.classHistory[encounter.classHistory.length - 1];
    if (!lastClass || lastClass.class?.code !== 'IMP') {
      encounter.classHistory.push({
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'IMP',
          display: 'inpatient'
        },
        period: {
          start: now
        }
      });
    }

    // ✅ Ensure hospitalization object exists
    if (!encounter.hospitalization) {
      encounter.hospitalization = {};
    }

    // ✅ Merge user-provided data (from form) with normalized standards
    const normalizedEncounter = {
      ...encounter,
      ...encounterData,
      // Override critical fields to ensure correctness
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient'
      },
      // Preserve hospitalization data from form (admit source, pre-admission ID)
      hospitalization: {
        ...encounter.hospitalization,
        ...encounterData.hospitalization
      },
      // Preserve statusHistory and classHistory
      statusHistory: encounter.statusHistory,
      classHistory: encounter.classHistory
    };

    // Update internal state
    this.currentEncounter = normalizedEncounter;

    console.log('✅ Encounter normalized for admission:', normalizedEncounter);
    return normalizedEncounter;
  }

  /**
   * Get current encounter being worked on
   */
  getCurrentEncounter(): any {
    return this.currentEncounter;
  }

  /**
   * Clear current encounter
   * Called after successful submission or on component destroy
   */
  clearCurrentEncounter(): void {
    console.log('🗑️ Clearing current encounter from AdmissionService');
    this.currentEncounter = undefined;
  }

  errorService = inject(ErrorService);
  dialog = inject(MatDialog);

  /**
   * Helper: Check if a Location resource is a ward
   * @param location - FHIR Location resource or raw object with physicalType
   * @returns true if the location is a ward
   */
  isWard(location: any): boolean {
    if (!location?.physicalType) return false;

    const physicalType = location.physicalType;
    const text = physicalType.text?.toLowerCase().trim();
    const codings = Array.isArray(physicalType.coding) ? physicalType.coding : [];
    // alert(text);
    // Check text field
    if (text === 'ward' || text === 'wa') return true;

    // Check coding array for FHIR standard codes
    return codings.some((coding: any) => {
      const code = coding?.code?.toLowerCase().trim();
      const display = coding?.display?.toLowerCase().trim();

      // FHIR location-physical-type: 'wa' = ward
      return code === 'wa' || code === 'ward' ||
        display === 'ward' || display === 'wa';
    });
  }

  /**
   * Helper: Check if a Location resource is a room
   * @param location - FHIR Location resource or raw object with physicalType
   * @returns true if the location is a room
   */
  isRoom(location: any): boolean {
    if (!location?.physicalType) return false;

    const physicalType = location.physicalType;
    const text = physicalType.text?.toLowerCase().trim();
    const codings = Array.isArray(physicalType.coding) ? physicalType.coding : [];

    // Check text field
    if (text === 'room' || text === 'ro') return true;

    // Check coding array for FHIR standard codes
    return codings.some((coding: any) => {
      const code = coding?.code?.toLowerCase().trim();
      const display = coding?.display?.toLowerCase().trim();

      // FHIR location-physical-type: 'ro' = room
      return code === 'ro' || code === 'room' ||
        display === 'room' || display === 'ro';
    });
  }

  /**
   * Helper: Check if a Location resource is a bed
   * @param location - FHIR Location resource or raw object with physicalType
   * @returns true if the location is a bed
   */
  isBed(location: any): boolean {
    if (!location?.physicalType) return false;

    const physicalType = location.physicalType;
    const text = physicalType.text?.toLowerCase().trim();
    const codings = Array.isArray(physicalType.coding) ? physicalType.coding : [];

    // Check text field
    if (text === 'bed' || text === 'bd') return true;

    // Check coding array for FHIR standard codes
    return codings.some((coding: any) => {
      const code = coding?.code?.toLowerCase().trim();
      const display = coding?.display?.toLowerCase().trim();

      // FHIR location-physical-type: 'bd' = bed
      return code === 'bd' || code === 'bed' ||
        display === 'bed' || display === 'bd';
    });
  }

  /**
   * Helper: Get the location type as a string
   * @param location - FHIR Location resource
   * @returns 'ward', 'room', 'bed', or 'unknown'
   */
  getLocationType(location: any): 'ward' | 'room' | 'bed' | 'unknown' {
    if (this.isWard(location)) return 'ward';
    if (this.isRoom(location)) return 'room';
    if (this.isBed(location)) return 'bed';
    return 'unknown';
  }

  /**
   * Helper: Filter locations by type
   * @param locations - Array of Location resources
   * @param type - 'ward', 'room', or 'bed'
   * @returns Filtered array of locations
   */
  filterLocationsByType(locations: any[], type: 'ward' | 'room' | 'bed'): any[] {
    if (!Array.isArray(locations)) return [];

    switch (type) {
      case 'ward':
        return locations.filter(loc => this.isWard(loc));
      case 'room':
        return locations.filter(loc => this.isRoom(loc));
      case 'bed':
        return locations.filter(loc => this.isBed(loc));
      default:
        return [];
    }
  }

  /**
   * Helper: Check if a Location is available (not occupied)
   * @param location - FHIR Location resource
   * @returns true if the location is available for admission
   */
  private isLocationAvailable(location: any): boolean {
    if (!location) return false;

    // Check operationalStatus for occupancy
    // FHIR operationalStatus uses codes like 'occupied', 'unoccupied', 'contaminated', etc.
    const opStatus = location.operationalStatus;

    if (!opStatus) {
      // If no operationalStatus, assume available
      return true;
    }

    // Check coding array
    const codings = Array.isArray(opStatus.coding) ? opStatus.coding : [];
    const isOccupied = codings.some((coding: any) => {
      const code = coding?.code?.toLowerCase().trim();
      const display = coding?.display?.toLowerCase().trim();

      // FHIR v2-0116 codes: 'O' = Occupied, 'U' = Unoccupied, 'K' = Contaminated
      return code !== 'u' || code !== 'unoccupied' ||
        display !== 'unoccupied' || display !== 'u';
    });

    // Also check text field
    const text = opStatus.text?.toLowerCase().trim();
    if (text !== 'unoccupied' || text !== 'o') {
      return false;
    }

    // Check status field as fallback
    const status = location.status?.toLowerCase();
    if (status === 'suspended' || status === 'inactive') {
      return false;
    }

    return !isOccupied;
  }

  /**
   * Public getter for available beds (for use in component)
   */
  getAvailableBeds(): any[] {
    return this.availableBeds;

  }

  /**
   * Public getter for available rooms (for use in component)
   */
  getAvailableRooms(): any[] {
    return this.availableRooms;
  }

  /**
   * Public getter for available wards (for use in component)
   */
  getAvailableWards(): any[] {
    return this.availableWards;
  }

  /**
   * ✅ NEW: Cleanup method to unsubscribe when service is destroyed
   * (Note: Root services rarely destroy, but good practice)
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
