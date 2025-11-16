import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, Inject, inject, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField, generalFieldsData, CodeableConceptFieldFromBackEnd } from '../shared/dynamic-forms.interface2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { EncounterServiceService } from './encounter-service.service';
import { MatMenuModule } from '@angular/material/menu';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { PatientSidedetailsComponent } from '../patient-sidedetails/patient-sidedetails.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { TopActionsService } from '../app-wrapper/top-actions.service';
import { AdmissionService } from '../admission/add-admission/admission.service';
import { PatientAdmissionWrapperComponent } from '../patient-admission-wrapper/patient-admission-wrapper.component';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
import { BookingsFormComponent } from '../bookings-form/bookings-form.component';
import { AuthService } from '../shared/auth/auth.service';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
import { CheckSheetComponent } from '../check-sheet/check-sheet.component';
import { StateService } from '../shared/state.service';
import { backendEndPointToken } from '../app.config';
import { Bundle } from 'fhir/r4';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-patient-wrapper',
  imports: [MatTabsModule,
    MatButtonModule,
    PatientSidedetailsComponent, MatSidenavModule, PatientAdmissionWrapperComponent,
    SidemenuComponent, DashboardsWrapperComponent, TopbreadcrumbComponent, TopProfileComponent,
    RouterOutlet, TitleCasePipe, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule,

    AsyncPipe
  ],
  templateUrl: './patient-wrapper.component.html',
  styleUrl: './patient-wrapper.component.scss'
})
export class PatientWrapperComponent {
  constructor(@Inject(backendEndPointToken) private backendEndPointToken: string) {

  }
  stateService = inject(StateService);

  // http = inject(HttpClient);
  // sn = inject(MatSnackBar);
  confirmCancelButKeep(status: string) {
    const dRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Encounter',
        message: 'Cancel this encounter but keep related resources as-is?',
        confirmText: 'Yes, cancel only',
        cancelText: 'No',
        icon: 'warning'
      }
    });
    dRef.afterClosed().subscribe(ok => {
      if (ok) this.changeEncounterStatus(status);
    });
  }

  confirmCancelAll(status: string) {
    const dRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Encounter and Related Resources',
        message: 'Cancel this encounter and set statuses of all related resources accordingly? This cannot be undone.',
        confirmText: 'Yes, cancel all',
        cancelText: 'No',
        icon: 'warning'
      }
    });
    dRef.afterClosed().subscribe(ok => {
      if (ok) this.changeEncunterStatusToCancelandChangeReferencedResourceStatusToCorrespondingStatus();
    });
  }

  changeEncounterStatus(status: string) {

    this.http.put(`${this.backendEndPointToken}/Encounter?_id=${this.stateService.currentEncounter?.getValue()?.['id']}`,
      {
        ...this.stateService.currentEncounter?.getValue(), status: status,
        patientId: null

      }).subscribe({
        next: (res) => {
          console.log('Encounter status updated successfully:', res);

          this.sn.openFromComponent(SuccessMessageComponent, {
            data: {
              message: `Encounter status changed to "${status}" successfully.`,
            },
            duration: 3000,
          });
          if (['on-hold', 'finished', 'cancelled'].includes(status)) {
            this.stateService.setCurrentEncounter(null)
          }
        },
        error: (err) => {
          console.error('Error updating encounter status:', err);
          this.errorService.openandCloseError("An errored ocurred and the status was nt changed")
        }
      });
  }

  // Cancel Encounter and set statuses of linked resources to corresponding values.
  changeEncunterStatusToCancelandChangeReferencedResourceStatusToCorrespondingStatus() {
    const encounter = this.stateService.currentEncounter?.getValue();
    const encounterId = encounter?.['id'];
    if (!encounterId) {
      this.errorService.openandCloseError('No active encounter to cancel.');
      return;
    }

    const pickLinked = (items: Array<{ actualResource: any }>) =>
      (items || [])
        .map(x => x.actualResource)
        .filter(r => r?.id && this.stateService.isResourceForCurrentEncounter(r));

    const obsToUpdate = pickLinked(this.stateService.PatientResources.observations.getValue())
      .map((r: any) => ({ ...r, status: 'cancelled' }));

    const medReqsToUpdate = pickLinked(this.stateService.PatientResources.medicationRequests.getValue())
      .map((r: any) => ({ ...r, status: 'cancelled' }));

    const condsToUpdate = pickLinked(this.stateService.PatientResources.condition.getValue())
      .map((r: any) => ({
        ...r,
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'entered-in-error',
            display: 'Entered in Error'
          }],
          text: 'entered-in-error'
        }
      }));

    const encounterUpdate$ = this.http.put(
      `${this.backendEndPointToken}/Encounter?_id=${encounterId}`,
      { ...encounter, status: 'cancelled', patientId: null }
    );

    const updateCalls = [
      encounterUpdate$,
      ...obsToUpdate.map(r => this.http.put(`${this.backendEndPointToken}/Observation?_id=${r.id}`, r)),
      ...medReqsToUpdate.map(r => this.http.put(`${this.backendEndPointToken}/MedicationRequest?_id=${r.id}`, r)),
      ...condsToUpdate.map(r => this.http.put(`${this.backendEndPointToken}/Condition?_id=${r.id}`, r)),
    ];

    forkJoin(updateCalls).subscribe({
      next: () => {
        const bundle: Bundle = {
          resourceType: 'Bundle',
          type: 'transaction',
          entry: [
            { resource: { ...encounter, resourceType: 'Encounter', status: 'cancelled' } as any },
            ...obsToUpdate.map(r => ({ resource: r })),
            ...medReqsToUpdate.map(r => ({ resource: r })),
            ...condsToUpdate.map(r => ({ resource: r })),
          ]
        };
        this.stateService.processBundleTransaction(bundle as any);

        this.sn.openFromComponent(SuccessMessageComponent, {
          data: { message: 'Encounter cancelled and related resources updated.' },
          duration: 3000,
        });
        this.stateService.setCurrentEncounter(null);
      },
      error: (err) => {
        console.error('Failed to cancel and update related resources:', err);
        this.errorService.openandCloseError('Failed to cancel encounter or update related resources.');
      }
    });
  }

  auth = inject(AuthService);

  route = inject(ActivatedRoute);
  sn = inject(MatSnackBar);
  dialog = inject(MatDialog);
  http = inject(HttpClient);
  encounterState: Observable<any> | undefined;

  patientId: string = '';
  links: string[] = ['summary', 'observations', 'diagnosis', 'tests-requests', 'medications', 'allergies', 'immunizations'];

  // 'medications', 'procedures', 'immunizations', 'allergies', 'encounters'];
  activeLink = this.links[0];
  ecounterService = inject(EncounterServiceService)

  resolvedData: any;
  patientDetailsStripService = inject(PatientDetailsKeyService);
  isPatientAdmitted: boolean = false;
  ngOnInit() {
    this.route.queryParams.subscribe((e: any) => {
      if (e['type'] && e['type'] == 'admitted') {
        alert(e['type']);
        this.isPatientAdmitted = true;
      }
    })
    // this.patientDetailsStripService.openPatientDetailsStrip();
    combineLatest({
      data: this.route.data, params:
        this.route.params
    }).subscribe(({ params, data }) => {
      this.patientId = params['id'];
      console.log('Patient ID:', this.patientId);

      this.resolvedData = data['patientData'];
      console.log('Resolved patient data:', this.resolvedData);

      // Handle case where patient data couldn't be loaded
      if (!this.resolvedData) {
        console.error('No patient data found for ID:', this.patientId);
        // You could show an error message or redirect here
        // For now, we'll continue but components should handle null data
      }

      // Initialize encounter state
      this.encounterState = this.ecounterService.getEncounterState(this.patientId);
      console.log('Encounter State:', this.encounterState);
    })
  }

  addEncounter() {
    this.ecounterService.addEncounter(this.patientId);
    // Logic to add an encounter
    // console.log('Add Encounter clicked');
    // forkJoin({
    //   class: this.http.get("/encounter/encounter_class.json"),
    //   priority: this.http.get("/encounter/encounter_priority.json"),
    //   reference: this.http.get("/encounter/encounter_reference.json"),
    //   participant: this.http.get("/encounter/encounter_participant.json") as Observable<ReferenceDataType>,
    //   reason: this.http.get("/encounter/encounter_reason.json"),
    //   reason_use: this.http.get("/encounter/encounter_reason_use.json"),

    // }).pipe(map((all: any) => {
    //   const keys = Object.keys(all);
    //   keys.forEach((key) => {
    //     console.log(all[key]);
    //     if (all[key].hasOwnProperty('system') && all[key].hasOwnProperty('property')) {
    //       all[key] = {
    //         ...all[key], concept: all[key].concept.map((e: any) => {

    //           const system = all[key].system;
    //           console.log(key);
    //           return { ...e, system }


    //         })
    //       }
    //     } else {
    //       all[key] = all[key]
    //     }
    //   })
    //   return all;
    // })).subscribe((g: any) => {
    //   console.log(g);
    //   const dRef = this.dialog.open(DynamicFormsV2Component, {
    //     maxHeight: '90vh',
    //     maxWidth: '900px',
    //     autoFocus: false,
    //     data: {

    //       formMetaData: <formMetaData>{
    //         formName: 'Encounter (Visits)',
    //         formDescription: "Record your encounter with patient",
    //         submitText: 'Initiate Encounter',
    //       },

    //       formFields: <FormFields[]>
    //         [
    //           {
    //             generalProperties: {

    //               fieldApiName: 'class',
    //               fieldName: 'Type of Encounter',
    //               fieldLabel: 'Type of Encounter',
    //               fieldType: 'CodeableConceptField',
    //               isArray: false,
    //               isGroup: false
    //             },
    //             data: <codeableConceptDataType>{
    //               coding: g.class.concept
    //             }
    //           },
    //           {
    //             generalProperties: {

    //               fieldApiName: 'priority',
    //               fieldName: 'Encounter Urgency',
    //               fieldLabel: 'Encounter Urgency',
    //               fieldType: 'CodeableConceptField',
    //               isArray: false,
    //               isGroup: false
    //             },
    //             data: <codeableConceptDataType>{
    //               coding: g.priority.concept
    //             }
    //           },
    //           {
    //             generalProperties: {

    //               fieldApiName: 'participant',
    //               fieldName: 'Participant',
    //               fieldLabel: 'People Providing Service',
    //               fieldType: 'IndividualReferenceField',
    //               isArray: true,
    //               isGroup: false
    //             },
    //             data: <ReferenceDataType>g.participant



    //           },

    //           {
    //             generalProperties: {
    //               fieldApiName: 'encounter_reason',
    //               fieldName: 'Reason for Encounter',
    //               fieldLabel: 'Reason for Encounter',
    //               isArray: true,
    //               isGroup: true

    //             },
    //             groupFields: {
    //               'reason': <CodeableConceptField>{
    //                 generalProperties: {
    //                   fieldApiName: 'reason',
    //                   fieldName: 'Reason for Encounter',
    //                   fieldLabel: 'Reason for Encounter',
    //                   fieldType: 'CodeableConceptField',
    //                   isArray: false,
    //                   isGroup: false
    //                 },
    //                 data: {
    //                   coding: g.reason.concept
    //                 }
    //               },
    //               'encounter_use': <CodeableConceptField>{
    //                 generalProperties: {
    //                   fieldApiName: 'encounter_reason_use',
    //                   fieldName: 'Reason\'s Type',
    //                   fieldLabel: 'Reason\'s Type',
    //                   fieldType: 'CodeableConceptField',
    //                   isArray: false,
    //                   isGroup: false
    //                 },
    //                 data: {
    //                   coding: g.reason_use.concept
    //                 }
    //               }
    //             }




    //           }

    //         ]



    //     }
    //   })

    //   dRef.afterClosed().subscribe((result) => {
    //     console.log(result);
    //     // Handle the result of the dialog here
    //     if (result) {
    //       this.ecounterService.setEncounterState(this.patientId, 'in-progress');
    //       this.sn.openFromComponent(SuccessMessageComponent, {
    //         data: {
    //           message: 'Encounter initiated successfully',

    //         },
    //         panelClass: "error-dialog",
    //         duration: 3000,
    //         horizontalPosition: 'center',
    //         verticalPosition: 'top'
    //       })
    //     } else {
    //       this.errorService.openandCloseError("You did not initiate an encounter before closing the encounter form!.")
    //     }

    //   });

    //   // this.dialog.open(DynamicFormsComponent, {
    //   //   maxWidth: '560px',
    //   //   maxHeight: '90%',
    //   //   autoFocus: false,
    //   //   data: {
    //   //     formMetaData: <formMetaData>{
    //   //       formName: 'Encounter (Visits)',
    //   //       formDescription: "Record your encounter with patient",
    //   //       submitText: 'Initiate Encounter',
    //   //     },
    //   //     formFields: <formFields[]>[{
    //   //       fieldApiName: 'class',
    //   //       fieldName: 'Type of Encounter',
    //   //       fieldLabel: 'Type of Encounter',
    //   //       dataType: 'CodeableConcept',
    //   //       codingConcept: g.class.concept,
    //   //       codingSystems: g.class.system

    //   //     },

    //   //     {
    //   //       fieldApiName: 'priority',
    //   //       fieldName: 'Encounter Urgency',
    //   //       fieldLabel: 'Urgency of the encounter',
    //   //       dataType: 'CodeableConcept',
    //   //       codingConcept: g.priority.concept,
    //   //       codingSystems: g.priority.system

    //   //     }, {
    //   //       fieldApiName: 'participant',
    //   //       fieldName: 'Participant',
    //   //       fieldLabel: 'People Providing Service',
    //   //       dataType: 'Reference',
    //   //       BackboneElement_Array: true,
    //   //       Reference: g.participant,

    //   //     }, {
    //   //       fieldApiName: 'reason',
    //   //       fieldName: 'Reaon for Encounter',
    //   //       fieldLabel: 'Reason for Encounter',
    //   //       dataType: 'CodeableConcept',
    //   //       codingConcept: g.reason.concept,
    //   //       codingSystems: g.reason.system,
    //   //       BackboneElement_Array: true,


    //   //     }]
    //   //   }
    //   // })
    // })
    // You can implement the logic to open a dialog or navigate to a form here
  }

  addObservation() {
    this.ecounterService.addObservation(this.patientId, 'exam');
    // forkJoin({

    //   practitioner: this.http.get("/encounter/encounter_participant.json") as Observable<ReferenceDataType>,
    //   category: this.http.get("/observation/observation_category.json"),
    //   code: this.http.get("/observation/observation_code.json"),


    // }).pipe(map((all: any) => {
    //   const keys = Object.keys(all);
    //   keys.forEach((key) => {
    //     console.log(all[key]);
    //     if (all[key].hasOwnProperty('system') && all[key].hasOwnProperty('property')) {
    //       all[key] = {
    //         ...all[key], concept: all[key].concept.map((e: any) => {

    //           const system = all[key].system;
    //           return { ...e, system }


    //         })
    //       }
    //     } else {
    //       all[key] = all[key]
    //     }
    //   })
    //   return all;
    // })).subscribe((g: any) => {
    //   console.log(g);
    //   const dRef = this.dialog.open(DynamicFormsV2Component, {
    //     maxHeight: '90vh',
    //     maxWidth: '900px',
    //     autoFocus: false,
    //     data: {

    //       formMetaData: <formMetaData>{
    //         formName: 'Observations',
    //         formDescription: "Record your Observations",
    //         submitText: 'Submit Observation',
    //       },
    //       formFields: <FormFields[]>[
    //         {

    //           generalProperties: {

    //             fieldApiName: 'category',
    //             fieldName: 'Observation Category',
    //             fieldLabel: 'Observation Category',

    //             fieldType: 'CodeableConceptField',
    //             isArray: false,
    //             isGroup: false
    //           },
    //           data: <codeableConceptDataType>{
    //             coding: g.category.concept
    //           }
    //           ,
    //         },

    //         {

    //           generalProperties: {

    //             fieldApiName: 'name',
    //             fieldName: 'Name of Observation',
    //             fieldLabel: 'Name of Observation',

    //             fieldType: 'CodeableConceptField',
    //             isArray: false,
    //             isGroup: false
    //           },
    //           data: <codeableConceptDataType>{
    //             coding: g.code.concept
    //           }
    //           ,
    //         },
    //         <SingleCodeField>{

    //           generalProperties: {

    //             fieldApiName: 'status',
    //             fieldName: 'Observation\'s Status',
    //             fieldLabel: 'Observation\'s Status',

    //             fieldType: 'SingleCodeField',
    //             isArray: false,
    //             isGroup: false
    //           },
    //           data: this.observation_status
    //           ,
    //         },
    //         <GroupField>{
    //           groupFields: {
    //             'result_type': <SingleCodeField>{

    //               generalProperties: {

    //                 fieldApiName: 'result_type',
    //                 fieldName: 'Type of Result',
    //                 fieldLabel: 'Type of Result',

    //                 fieldType: 'SingleCodeField',
    //                 isArray: false,
    //                 isGroup: false
    //               },
    //               data: ['Number', 'Text']

    //             },
    //             'result_value': <IndividualField>{
    //               generalProperties: {

    //                 fieldApiName: 'result_value',
    //                 fieldName: 'Result Value',
    //                 fieldLabel: 'Result Value',

    //                 fieldType: 'IndividualField',
    //                 isArray: false,
    //                 isGroup: false
    //               },


    //             },

    //             'result_unit': <IndividualField>{

    //               generalProperties: {

    //                 fieldApiName: 'result_unit',
    //                 fieldName: 'Unit',
    //                 fieldLabel: 'Unit',

    //                 fieldType: 'SingleCodeField',
    //                 isArray: false,
    //                 isGroup: false
    //               },
    //               data: this.observation_units

    //             },


    //           },
    //           keys: [
    //             ''
    //           ],
    //           generalProperties: {

    //             fieldApiName: 'value',
    //             fieldName: 'Test Results',
    //             fieldLabel: 'Test Results',
    //             fieldType: 'SingleCodeField',
    //             isArray: false,
    //             isGroup: true
    //           },


    //         },

    //         <GroupField>{
    //           groupFields: {
    //             'result_type': <SingleCodeField>{

    //               generalProperties: {

    //                 fieldApiName: 'result_type',
    //                 fieldName: 'Type',
    //                 fieldLabel: 'Type',

    //                 fieldType: 'SingleCodeField',
    //                 isArray: false,
    //                 isGroup: false
    //               },
    //               data: ['Numbers', 'words']

    //             },
    //             'result_value': <IndividualField>{
    //               generalProperties: {

    //                 fieldApiName: 'result_value',
    //                 fieldName: 'Value',
    //                 fieldLabel: ' Value',

    //                 fieldType: 'IndividualField',
    //                 isArray: false,
    //                 isGroup: false
    //               },


    //             },

    //             'result_unit': <IndividualField>{

    //               generalProperties: {

    //                 fieldApiName: 'result_unit',
    //                 fieldName: 'Unit',
    //                 fieldLabel: 'Unit',

    //                 fieldType: 'SingleCodeField',
    //                 isArray: false,
    //                 isGroup: false
    //               },
    //               data: this.observation_units

    //             },


    //           },
    //           keys: [
    //             ''
    //           ],
    //           generalProperties: {

    //             fieldApiName: 'Normal Range',
    //             fieldName: 'Normal Test  Range',
    //             fieldLabel: 'Normal Test Range',
    //             fieldType: 'SingleCodeField',
    //             isArray: false,
    //             isGroup: true
    //           },


    //         },
    //       ]
    //     }
    //   })
    // })

  }
  addExamObservation() {
    this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '1200px',
      autoFocus: false,
      data: {
        isAnyCategory: false,
        observationCategoryValue: "exam"
      }
    })
  }



  showEncounterSheet() {

    this.dialog.open(CheckSheetComponent, {
      maxHeight: '90vh',
      maxWidth: '900px',
      autoFocus: false,
      data: {
        patientId: this.patientId
      }
    })
  }
  addDiagnosis() {
    forkJoin({
      code: this.formFieldsDataService.getFormFieldSelectData('condition', 'code'),
      //ce.getFormFieldSelectData('medication', 'reason'),
    }).subscribe({
      next: (g: any) => {
        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Diagnosis Form',
              formDescription: "Use this form to enter a diagnosis for the patient. You can request A.I. assistance using the side chat",
              submitText: 'Confirm Diagnosis',
            },
            formFields: <FormFields[]>[
              // verificationStatus - unconfirmed | provisional | differential | confirmed | refuted | entered-in-error
              //clinicalStatus - 	active | recurrence | relapse | inactive | remission | resolved | unknown
              //severity - mild | moderate | severe
              //code - 
              //onsetDateTime - 
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'clinicalStatus',
                  fieldName: "Clinical Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                },
                data: "active | recurrence | relapse | inactive | remission | resolved | unknown".split('|').map((e: string) => e.trim())
              },
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'verificationStatus',
                  fieldName: "Verification Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                },
                data: "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split('|').map((e: string) => e.trim())
              },
              //severity
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'severity',
                  fieldName: "Severity",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                },
                data: "mild | moderate | severe".split('|').map((e: string) => e.trim())
              },
              //code
              <CodeableConceptFieldFromBackEnd>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'code',
                  fieldName: "Diagnosis Code & Name",
                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                },
                data: g.code,
              },



              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'onsetDateTime',
                  fieldName: "Onset Date/Time",
                  fieldType: 'IndividualField',
                  inputType: 'datetime-local',
                  isArray: false,
                  isGroup: false,
                },
                data: ""
              }
            ]
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching diagnosis data:', err);
        this.errorService.openandCloseError('Error fetching diagnosis data. Please try again later.');




      }
    })
  }
  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService)
  addMedicationRequest() {
    forkJoin({
      medication: this.formFieldsDataService.getFormFieldSelectData('medication', 'medication'),
      status: this.formFieldsDataService.getFormFieldSelectData('medication', 'status'),
      intent: this.formFieldsDataService.getFormFieldSelectData('medication', 'intent'),
      performerType: this.formFieldsDataService.getFormFieldSelectData('medication', 'performerType'),
      reason: this.formFieldsDataService.getFormFieldSelectData('medication', 'reason'),
    }).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '900px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Medication Request / Prescription',
              formDescription: "Use this form to record a medication request or prescription for the patient.",
              submitText: 'Submit Prescription',
            },
            formFields: <FormFields[]>[
              {

                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Status of Medication',
                  fieldLabel: 'Status of Medication',
                  value: 'active',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: false
                },
                data: g.status

              },
              {

                generalProperties: {

                  fieldApiName: 'intent',
                  fieldName: 'Intent of Medication',
                  fieldLabel: 'Intent of Medication',
                  value: 'order',
                  moreHint: "Do you intend that this medication should be ordered right away or is just a proposal",
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: false
                },
                data: g.intent

              },
              {
                generalProperties: {

                  fieldApiName: 'medication',
                  fieldName: 'Medication / Drug',
                  fieldLabel: 'Medication / Drug',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  moreHint: "Search and choose a medication from the list",


                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.medication

              },
              {
                generalProperties: {

                  fieldApiName: 'performerType',
                  fieldName: 'Medication Administered By',
                  fieldLabel: 'Medication Administered By',
                  moreHint: "Who should administer the medication to the patient",
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.performerType

              },
              {
                generalProperties: {

                  fieldApiName: 'reason',
                  fieldName: 'Reason for Medication',
                  fieldLabel: 'Reason for Medication',


                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldType: 'CodeableConceptFieldFromBackEnd',




                  isArray: false,
                  isGroup: false
                },
                data: g.reason

              },
              {
                generalProperties: {

                  fieldApiName: 'dosageInstruction',
                  fieldName: 'Dosage Instruction',
                  fieldLabel: 'Dosage Instruction',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  inputType: "textarea",



                  isArray: false,
                  isGroup: false
                },
                data: g.performerType

              },


            ]
          }
        })


      },
      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');




      }
    }
    )

  }

  completeEncounter() { }



  medication_status = [
    "active", "on-hold", "ended", "stopped", "completed", "cancelled", "entered-in-error"


  ]
  observation_status = [
    "registered",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "cancelled",
    "entered-in-error",
    "unknown"
  ]

  observation_units = [
    "kg",     // kilograms
    "g",      // grams
    "mg",     // milligrams
    "ug",     // micrograms
    "L",      // liters
    "mL",     // milliliters
    "cm",     // centimeters
    "mm",     // millimeters
    "m",      // meters
    "mmHg",   // millimeters of mercury (blood pressure)
    "bpm",    // beats per minute (heart rate)
    "/min",   // per minute (respiration rate)
    "°C",     // degrees Celsius (body temperature)
    "%",      // percent (e.g., oxygen saturation)
    "mol/L",  // moles per liter (common for electrolytes)
    "mmol/L", // millimoles per liter (common for glucose, cholesterol)
    "mg/dL",  // milligrams per deciliter
    "ng/mL",  // nanograms per milliliter
    "U/L",    // units per liter (e.g., liver enzymes)
    "IU/L",   // international units per liter
    "mEq/L",  // milliequivalents per liter
    "cm[H2O]",// centimeters of water (respiratory pressure)
    "s",      // seconds
    "min",    // minutes
    "h",      // hours
    "d"       // days
  ]

  @ViewChild('topactions') topactions?: TemplateRef<any>
  topactionService = inject(TopActionsService)
  ngAfterViewInit() {
    this.auth.user.subscribe((e: any) => {

      if (this.topactions && e.role === 'doctor') {
        this.topactionService.insertTopAction(this.topactions);
      } else {
        this.topactionService.removeTopAction();
      }
    })
  }


  ngOnDestroy() {
    if (this.topactions) {
      this.topactionService.removeTopAction();
    }
  }

  admissionService = inject(AdmissionService);
  openAdmissionDialog() {
    const dRef = this.dialog.open(DynamicFormsV2Component, {
      maxHeight: '90vh',
      maxWidth: '600px',
      autoFocus: false,
      data: {

        formMetaData: <formMetaData>{
          formName: 'Admission',
          formDescription: "Use this form to admit a patient",
          submitText: 'Admit Patient',
        },
        formFields: <FormFields[]>[
          {
            generalProperties: {
              fieldApiName: 'admission_reason',
              fieldName: 'Reason for Admission',
              fieldLabel: 'Reason for Admission',
              fieldType: 'IndividualField',
              isArray: false,
              isGroup: false
            },
            data: []
          }
        ]
      }
    })
  }
  addVitals() {
    this.dialog.open(AddVitalsComponent, {
      maxHeight: "90vh",
      maxWidth: "680px"
    })
  }

  showBooking() {
    this.dialog.open(BookingsFormComponent, {
      maxHeight: '93vh',
      maxWidth: '1200px',
    })
  }

  referPatient() {
    forkJoin({
      organization: this.formFieldsDataService.getFormFieldSelectData('referral', 'organization'),
    }).subscribe((g: any) => {
      console.log(g);
      const dRef = this.dialog.open(DynamicFormsV2Component, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        data: {
          formMetaData: <formMetaData>{
            formName: 'Refer Patient',
            formDescription: "Use this form to refer a patient.The patient details in the ongoing encounter will be used to refer the patient. You can restrict the details to be sent to the organization.",
            submitText: 'Refer Patient',
          },
          formFields: <FormFields[]>[
            {
              generalProperties: {
                fieldApiName: 'organization',
                fieldName: 'Organization',
                fieldLabel: 'Organization',
                fieldType: 'IndividualReferenceField',
                isArray: false,
                isGroup: false
              },
              data: g.organization
            },
            <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'referral_details',
                fieldName: "Details to be sent",
                fieldHint: "Select the details from this encounter to be sent to the organization",
                fieldType: 'SingleCodeField',
                inputType: 'checkbox',
                isArray: false,
                isGroup: false,


              },
              dataType: "SingleCodeDataType",
              data: ['patient', 'encounter', 'observations', 'Diagnostic report', 'diagnosis', 'medications', 'allergies', 'immunizations', 'procedures', 'vitals'],
            },
            //referrral reason
            {
              generalProperties: {
                fieldApiName: 'referral_reason',
                fieldName: 'Reason for Referral',
                fieldLabel: 'Reason for Referral',
                fieldType: 'IndividualField',
                isArray: false,

                isGroup: false
              },
            },

            {
              generalProperties: {
                fieldApiName: 'referral_notes',
                fieldName: 'Notes for Referral',
                fieldLabel: 'Notes for Referral',
                fieldType: 'IndividualField',
                isArray: false,
                inputType: 'textarea',
                isGroup: false
              },
            },
          ]
        }
      })
    })
  }
  confirmAndChangeEncounterStatus(status: string) {
    if (status !== 'cancelled') {
      this.changeEncounterStatus(status);
      return;
    }
    const dRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Encounter',
        message: 'Are you sure you want to cancel this encounter? Related draft data may be cleared.',
        confirmText: 'Yes, Cancel',
        cancelText: 'No',
        icon: 'warning'
      }
    });
    dRef.afterClosed().subscribe(ok => {
      if (ok) this.changeEncounterStatus(status);
    });
  }
}

