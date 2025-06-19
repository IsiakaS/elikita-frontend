import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
//import { EncounterServiceService } from './encounter-service.service';
import { MatMenuModule } from '@angular/material/menu';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { PatientSidedetailsComponent } from '../patient-sidedetails/patient-sidedetails.component';
import { MatSidenavModule } from '@angular/material/sidenav';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncounterServiceService {
  route = inject(ActivatedRoute);
  sn = inject(MatSnackBar);
  dialog = inject(MatDialog);
  http = inject(HttpClient);
  encounterState: Observable<any> | undefined;
  patientId: string = '';
  links: string[] = ['summary', 'observations', 'conditions', 'medications'];
  // 'medications', 'procedures', 'immunizations', 'allergies', 'encounters'];
  activeLink = this.links[0];
  //ecounterService = inject(EncounterServiceService)

  resolvedData: any;

  globalEncounterState: {
    [patientId: string]: BehaviorSubject<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'>

  } = {}
  constructor() { }

  setEncounterState(patientId: string, encounter: 'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown') {
    if (this.globalEncounterState.hasOwnProperty(patientId)) {
      console.log(encounter);
      this.globalEncounterState[patientId].next(encounter);
    } else {
      this.globalEncounterState[patientId] = new BehaviorSubject(encounter);
    }
  }

  getEncounterState(patientId: string): Observable<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'> {
    if (this.globalEncounterState.hasOwnProperty(patientId)) {

      return this.globalEncounterState[patientId];
      return this.globalEncounterState[patientId];
    } else {
      this.globalEncounterState[patientId] = new BehaviorSubject<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'>('unknown');

      return this.globalEncounterState[patientId];
    }
  }

  router = inject(Router)
  addEncounter(patientId: string) {
    // alert(patientId);
    // Logic to add an encounter
    console.log('Add Encounter clicked');
    forkJoin({
      class: this.http.get("/encounter/encounter_class.json"),
      priority: this.http.get("/encounter/encounter_priority.json"),
      reference: this.http.get("/encounter/encounter_reference.json"),
      participant: this.http.get("/encounter/encounter_participant.json") as Observable<ReferenceDataType>,
      reason: this.http.get("/encounter/encounter_reason.json"),
      reason_use: this.http.get("/encounter/encounter_reason_use.json"),

    }).pipe(map((all: any) => {
      const keys = Object.keys(all);
      keys.forEach((key) => {
        console.log(all[key]);
        if (all[key].hasOwnProperty('system') && all[key].hasOwnProperty('property')) {
          all[key] = {
            ...all[key], concept: all[key].concept.map((e: any) => {

              const system = all[key].system;
              console.log(key);
              return { ...e, system }


            })
          }
        } else {
          all[key] = all[key]
        }
      })
      return all;
    })).subscribe((g: any) => {
      console.log(g);
      const dRef = this.dialog.open(DynamicFormsV2Component, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        data: {

          formMetaData: <formMetaData>{
            formName: 'Encounter (Visits)',
            formDescription: "Record your encounter with patient",
            submitText: 'Initiate Encounter',
          },

          formFields: <FormFields[]>
            [
              {
                generalProperties: {

                  fieldApiName: 'class',
                  fieldName: 'Type of Encounter',
                  fieldLabel: 'Type of Encounter',
                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.class.concept
                }
              },
              {
                generalProperties: {

                  fieldApiName: 'priority',
                  fieldName: 'Encounter Urgency',
                  fieldLabel: 'Encounter Urgency',
                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.priority.concept
                }
              },
              {
                generalProperties: {

                  fieldApiName: 'participant',
                  fieldName: 'Participant',
                  fieldLabel: 'People Providing Service',
                  fieldType: 'IndividualReferenceField',
                  isArray: true,
                  isGroup: false
                },
                data: <ReferenceDataType>g.participant



              },

              {
                generalProperties: {
                  fieldApiName: 'encounter_reason',
                  fieldName: 'Reason for Encounter',
                  fieldLabel: 'Reason for Encounter',
                  isArray: true,
                  isGroup: true

                },
                groupFields: {
                  'reason': <CodeableConceptField>{
                    generalProperties: {
                      fieldApiName: 'reason',
                      fieldName: 'Reason for Encounter',
                      fieldLabel: 'Reason for Encounter',
                      fieldType: 'CodeableConceptField',
                      isArray: false,
                      isGroup: false
                    },
                    data: {
                      coding: g.reason.concept
                    }
                  },
                  'encounter_use': <CodeableConceptField>{
                    generalProperties: {
                      fieldApiName: 'encounter_reason_use',
                      fieldName: 'Reason\'s Type',
                      fieldLabel: 'Reason\'s Type',
                      fieldType: 'CodeableConceptField',
                      isArray: false,
                      isGroup: false
                    },
                    data: {
                      coding: g.reason_use.concept
                    }
                  }
                }




              }

            ]



        }
      })

      dRef.afterClosed().subscribe((result) => {
        console.log(result);
        // Handle the result of the dialog here
        if (result) {
          this.setEncounterState(patientId, 'in-progress');
          this.sn.openFromComponent(SuccessMessageComponent, {
            data: {
              message: 'Encounter initiated successfully',

            },
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          })
          this.dialog.closeAll();
          //alert(this.encounterState[this])

          this.router.navigate(["/app/patients/", patientId]);

        } else {
          this.errorService.openandCloseError("You did not initiate an encounter before closing the encounter form!.")

        }

      });

      // this.dialog.open(DynamicFormsComponent, {
      //   maxWidth: '560px',
      //   maxHeight: '90%',
      //   autoFocus: false,
      //   data: {
      //     formMetaData: <formMetaData>{
      //       formName: 'Encounter (Visits)',
      //       formDescription: "Record your encounter with patient",
      //       submitText: 'Initiate Encounter',
      //     },
      //     formFields: <formFields[]>[{
      //       fieldApiName: 'class',
      //       fieldName: 'Type of Encounter',
      //       fieldLabel: 'Type of Encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.class.concept,
      //       codingSystems: g.class.system

      //     },

      //     {
      //       fieldApiName: 'priority',
      //       fieldName: 'Encounter Urgency',
      //       fieldLabel: 'Urgency of the encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.priority.concept,
      //       codingSystems: g.priority.system

      //     }, {
      //       fieldApiName: 'participant',
      //       fieldName: 'Participant',
      //       fieldLabel: 'People Providing Service',
      //       dataType: 'Reference',
      //       BackboneElement_Array: true,
      //       Reference: g.participant,

      //     }, {
      //       fieldApiName: 'reason',
      //       fieldName: 'Reaon for Encounter',
      //       fieldLabel: 'Reason for Encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.reason.concept,
      //       codingSystems: g.reason.system,
      //       BackboneElement_Array: true,


      //     }]
      //   }
      // })
    })
    // You can implement the logic to open a dialog or navigate to a form here
  }

  addObservation(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      forkJoin({

        practitioner: this.http.get("/encounter/encounter_participant.json") as Observable<ReferenceDataType>,
        category: this.http.get("/observation/observation_category.json"),
        code: this.http.get("/observation/observation_code.json"),


      }).pipe(map((all: any) => {
        const keys = Object.keys(all);
        keys.forEach((key) => {
          console.log(all[key]);
          if (all[key].hasOwnProperty('system') && all[key].hasOwnProperty('property')) {
            all[key] = {
              ...all[key], concept: all[key].concept.map((e: any) => {

                const system = all[key].system;
                return { ...e, system }


              })
            }
          } else {
            all[key] = all[key]
          }
        })
        return all;
      })).subscribe((g: any) => {
        console.log(g);
        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '900px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Observations',
              formDescription: "Record your Observations",
              submitText: 'Submit Observation',
            },
            formFields: <FormFields[]>[
              {

                generalProperties: {

                  fieldApiName: 'category',
                  fieldName: 'Observation Category',
                  fieldLabel: 'Observation Category',

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.category.concept
                }
                ,
              },

              {

                generalProperties: {

                  fieldApiName: 'name',
                  fieldName: 'Name of Observation',
                  fieldLabel: 'Name of Observation',

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.code.concept
                }
                ,
              },
              <SingleCodeField>{

                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Observation\'s Status',
                  fieldLabel: 'Observation\'s Status',

                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: false
                },
                data: this.observation_status
                ,
              },
              <GroupField>{
                groupFields: {
                  'result_type': <SingleCodeField>{

                    generalProperties: {

                      fieldApiName: 'result_type',
                      fieldName: 'Type of Result',
                      fieldLabel: 'Type of Result',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: ['Number', 'Text']

                  },
                  'result_value': <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'result_value',
                      fieldName: 'Result Value',
                      fieldLabel: 'Result Value',

                      fieldType: 'IndividualField',
                      isArray: false,
                      isGroup: false
                    },


                  },

                  'result_unit': <IndividualField>{

                    generalProperties: {

                      fieldApiName: 'result_unit',
                      fieldName: 'Unit',
                      fieldLabel: 'Unit',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: this.observation_units

                  },


                },
                keys: [
                  ''
                ],
                generalProperties: {

                  fieldApiName: 'value',
                  fieldName: 'Test Results',
                  fieldLabel: 'Test Results',
                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: true
                },


              },

              <GroupField>{
                groupFields: {
                  'result_type': <SingleCodeField>{

                    generalProperties: {

                      fieldApiName: 'result_type',
                      fieldName: 'Type',
                      fieldLabel: 'Type',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: ['Numbers', 'words']

                  },
                  'result_value': <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'result_value',
                      fieldName: 'Value',
                      fieldLabel: ' Value',

                      fieldType: 'IndividualField',
                      isArray: false,
                      isGroup: false
                    },


                  },

                  'result_unit': <IndividualField>{

                    generalProperties: {

                      fieldApiName: 'result_unit',
                      fieldName: 'Unit',
                      fieldLabel: 'Unit',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: this.observation_units

                  },


                },
                keys: [
                  ''
                ],
                generalProperties: {

                  fieldApiName: 'Normal Range',
                  fieldName: 'Normal Test  Range',
                  fieldLabel: 'Normal Test Range',
                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: true
                },


              },
            ]
          }
        })
      })
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }

  }
  addDiagnosis(patientId: string) {
    if (this.encounterStateCheck(patientId)) {

    }
  }


  addSpecimen(patientId: string) {


    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('specimen', 'status'),
      type: this.formFieldsDataService.getFormFieldSelectData('specimen', 'type'),
      condition: this.formFieldsDataService.getFormFieldSelectData('specimen', 'condition'),
      bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
      // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).subscribe({
      next: (g: any) => {


        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '900px',
          autoFocus: false,
          data: {
            formMetaData: <formMetaData>{
              formName: 'Specimen Record ',
              formDescription: "Use this form to record specimens for a specific lab test",
              submitText: 'Submit Request',
            },
            formFields: <FormFields[]>[
              {
                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Status of Specimen',
                  fieldLabel: 'Status of Specimen',
                  value: 'Availabe',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.status

              }, {
                generalProperties: {

                  fieldApiName: 'type',
                  fieldName: 'Specimen Type',
                  fieldLabel: 'Specimen Type',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.type

              },
              {
                generalProperties: {

                  fieldApiName: 'receivedTime',
                  fieldName: 'Received Time',
                  fieldLabel: 'Received Time',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: 'datetime-local',
                  isArray: false,
                  isGroup: false
                },


              },
              {
                generalProperties: {

                  fieldApiName: 'condition',
                  fieldName: 'Specimen Condition',
                  fieldLabel: 'Specimen Condition',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.condition


              },
              {
                generalProperties: {

                  fieldApiName: 'bodySite',
                  fieldName: 'Body Collection Site',
                  fieldLabel: 'Body Collection Site',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  isArray: false,
                  isGroup: false
                },
                data: g.bodySite


              },
            ]
          }
        })
      },
      error: (err: any) => {
        this.errorService.openandCloseError("An error ocurred while fetching specimen data");
      }
    });

  }
  addServiceRequest(patientId: string) {

    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      forkJoin({
        status: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'status'),
        intent: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'intent'),
        code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
        performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
        priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
      }).subscribe({
        next: (g: any) => {
          console.log(g.medication);

          const dRef = this.dialog.open(DynamicFormsV2Component, {
            maxHeight: '90vh',
            maxWidth: '900px',
            autoFocus: false,
            data: {

              formMetaData: <formMetaData>{
                formName: 'Service Request (Lab Tests, e.t.c.)',
                formDescription: "Use this form to order a lab test or any other medical services from your or other department",
                submitText: 'Submit Request',
              },
              formFields: <FormFields[]>[
                {

                  generalProperties: {

                    fieldApiName: 'status',
                    fieldName: 'Status of Request',
                    fieldLabel: 'Status of Request',
                    value: 'active',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },

                    fieldType: 'CodeableConceptField',
                    isArray: false,
                    isGroup: false
                  },
                  data: g.status

                },
                {

                  generalProperties: {

                    fieldApiName: 'intent',
                    fieldName: 'Intent of the Request',
                    fieldLabel: 'Intent of the Request',
                    value: 'order',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },

                    fieldType: 'CodeableConceptField',
                    isArray: false,
                    isGroup: false
                  },
                  data: g.intent

                },
                {

                  generalProperties: {

                    fieldApiName: 'code',
                    fieldName: 'Service Requested',
                    fieldLabel: 'Service Requested',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },

                    fieldType: 'CodeableConceptFieldFromBackEnd',
                    isArray: true,
                    isGroup: false
                  },
                  data: g.code
                },
                {

                  generalProperties: {

                    fieldApiName: 'performerType',
                    fieldName: 'Pratitioner Required',
                    fieldLabel: 'Practitioner Required',
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

                    fieldApiName: 'priority',
                    fieldName: 'Priority',
                    fieldLabel: 'Priority',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },

                    fieldType: 'CodeableConceptField',
                    isArray: false,
                    isGroup: false
                  },
                  data: g.priority
                },
                {

                  generalProperties: {

                    fieldApiName: 'orderDetailParameterValueString',
                    fieldName: 'Additional Details',
                    fieldLabel: 'Additional Details',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },

                    inputType: 'textarea',
                    isArray: false,
                    isGroup: false
                  },
                  data: g.priority
                },



              ]
            }
          });
        },
        error: (err: any) => {
          console.error('Error fetching medication data:', err);
          this.errorService.openandCloseError('Error fetching medication data. Please try again later.');
        }
      })


    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");

    }
  }

  encounterStateCheck(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      return true;

    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
      return false;
    }
  }


  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService)
  addMedicationRequest(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
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
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }


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







}



