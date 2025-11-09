import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable, of, sample } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField, CodeableConceptFieldFromBackEnd, generalFieldsData } from '../shared/dynamic-forms.interface2';
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
import { EncounterCheckComponent } from '../encounter-check/encounter-check.component';
import { AddLabRequestsComponent } from '../lab-requests/add-lab-requests/add-lab-requests.component';
import { AddMedicineRequestsComponent } from '../medicine-requests/add-medicine-requests/add-medicine-requests.component';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
import { TestingTasksComponent } from '../testing-tasks/testing-tasks.component';
// import { AddAlllergyComponent } from '../allergy/add-alllergy/add-alllergy.component';
import { AddAllergyComponent } from '../allergy/add-allergy/add-allergy.component';
import { UtilityService } from '../shared/utility.service';

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

  getPatientId() {
    return this.route.snapshot.paramMap.get('patientId') || '';
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
      reason: this.formFieldsDataService.getFormFieldSelectData('encounter', 'reason'),
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
      const dRef = this.dialog.open(EncounterCheckComponent, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        data: {

          formMetaDataToUse: <formMetaData>{
            formName: 'Encounter (Visits)',
            formDescription: "Record your encounter with patient",
            submitText: 'Initiate Encounter',
          },

          formFieldsToUse:
          {
            'details': <FormFields[]>[
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
            ],
            'actors': <FormFields[]>[
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



              }],
            'notes': <FormFields[]>[{
              generalProperties: {

                fieldApiName: 'notes',
                fieldName: 'Other Symptom Details',
                fieldLabel: 'Other Symptom Details',
                fieldType: 'IndividualField',
                inputType: 'textarea',
                isArray: false,
                isGroup: false
              },
              data: ''
            }
            ]
            ,

            // {
            //   generalProperties: {
            //     fieldApiName: 'encounter_reason',
            //     fieldName: 'Reason for Encounter',
            //     fieldLabel: 'Reason for Encounter',
            //     isArray: true,
            //     isGroup: true

            //   },
            //   groupFields: {
            //     'reason':
            'reason': <FormFields[]>[<CodeableConceptFieldFromBackEnd>{
              generalProperties: {
                fieldApiName: 'reason',
                fieldName: 'Patient Symptom',
                fieldLabel: 'Patient Symptom',
                fieldType: "CodeableConceptFieldFromBackEnd",
                isArray: false,
                isGroup: false
              },
              data: g.reason
            },
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
                fieldLabel: "Whether the symptom is still active",
                fieldPlaceholder: "Whether the symptom is still active",
                value: 'Active',
                isArray: false,
                isGroup: false,

              },
              data: "active | recurrence | relapse | inactive | remission | resolved | unknown".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
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
                fieldLabel: "Is the Symptom Confirmed",
                fieldPlaceholder: "Is the Symptom Confirmed",
                isArray: false,
                isGroup: false,
                value: 'Confirmed'
              },
              data: "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
            },
            //severity
            <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                auth
                  : {
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
              data: "mild | moderate | severe".split(' | ').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
            },

















            <IndividualField>{
              generalProperties: <generalFieldsData>{
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'onsetDateTime',
                fieldName: "Onset Date/Time",
                fieldLabel: "When the symptom started",
                fieldPlaceholder: "When the symptom started",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
              },
              data: ""
            }
              // 'encounter_use': <CodeableConceptField>{
              //   generalProperties: {
              //     fieldApiName: 'encounter_reason_use',
              //     fieldName: 'Reason\'s Type',
              //     fieldLabel: 'Reason\'s Type',
              //     fieldType: 'CodeableConceptField',
              //     isArray: false,
              //     isGroup: false
              //   },
              //   data: {
              //     coding: g.reason_use.concept
              //   }
              // }
              // }




              // }

            ]


          }
        }
      })

      dRef.afterClosed().subscribe((result) => {
        console.log(result);
        // Handle the result of the dialog here
        // if (result) {
        if (true) {
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

          // this.router.navigate(["/app/patients/", patientId]);

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

  addObservation_former(patientId: string) {
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
                  fieldName: 'Observation / Tests Results',
                  fieldLabel: 'Observation / Tests Results',
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
























  addObservation(patientId: string, observationCategory: string | null = null) {
    let category = 'category'
    if (observationCategory) {
      switch (observationCategory) {
        case 'vitalSigns-exam':
          category = 'category2';
          break;
        case 'exam':
          category = 'category3'
          break;
        case 'lab-test':
          category = 'category4'
          break;
        default:
          break;


      }
    }
    if (
      (
        (category === 'category2' || category === 'category3') &&
        this.globalEncounterState.hasOwnProperty(patientId)
        && this.globalEncounterState[patientId].getValue() == 'in-progress'
      ) || (category !== 'category2' && category !== 'category3')
    ) {
      forkJoin({
        practitioner: this.formFieldsDataService.getFormFieldSelectData('observation', 'practitioner'),
        category2: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category3: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category4: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        code: this.formFieldsDataService.getFormFieldSelectData('observation', 'code'),
      }).subscribe((g: any) => {
        console.log(g);
        const dRef = this.dialog.open(AddObservationComponent, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {
            observationformFields: [[
              'category', {
                formFields:
                  <FormFields[]>[
                    {

                      generalProperties: {

                        fieldApiName: 'category',
                        fieldName: 'Observation / Test Category',
                        fieldLabel: 'Observation / Test Category',

                        fieldType: 'CodeableConceptField',
                        isArray: false,
                        isGroup: false
                      },
                      data: <codeableConceptDataType>{
                        coding: g[category]['concept']
                      }
                      ,
                    },

                  ]
              }],
            ['name',
              {
                formFields:
                  <FormFields[]>[
                    {

                      generalProperties: {

                        fieldApiName: 'name',
                        fieldName: 'Name of Observation / Test',
                        fieldHint: "Pick from suggested names or enter your own",
                        fieldLabel: 'Name of Observation / Test',

                        fieldType: 'CodeableConceptField',
                        isArray: false,
                        isGroup: false
                      },
                      data: <codeableConceptDataType>{
                        coding: g.code.concept
                      }
                      ,
                    },
                  ]

              }],
            ['value', {
              formFields: [
                <GroupField>{


                  groupFields: {
                    'result_type': <SingleCodeField>{

                      generalProperties: {

                        fieldApiName: 'result_type',
                        fieldName: 'Type of Result',
                        fieldLabel: 'Type of Result',
                        // value: category === "category3" ? 'Text' : '',
                        controllingField: [{
                          isAControlField: true,
                          dependentFieldVisibilityTriggerValue: 'Text',
                          controlledFieldDependencyId: "result_type.text"

                        },
                        {
                          isAControlField: true,
                          dependentFieldVisibilityTriggerValue: 'Number',
                          controlledFieldDependencyId: "result_type.number2"

                        },

                        {
                          isAControlField: true,
                          controlledFieldDependencyId: "result_type.number",
                          dependentFieldVisibilityTriggerValue: 'Number'
                        }],
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
                        inputType: 'number',
                        dependence_id: 'result_type.number',
                        fieldType: 'IndividualField',
                        isArray: false,
                        isGroup: false
                      },


                    },

                    'result_value_text': <IndividualField>{
                      generalProperties: {

                        fieldApiName: 'result_value',
                        fieldName: 'Result ',
                        fieldLabel: 'Result ',
                        inputType: 'textarea',
                        dependence_id: 'result_type.text',
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
                        fieldHint: 'Pick from suggested units or enter your own',
                        dependence_id: 'result_type.number2',
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
                    fieldName: category === "category3" ? 'Observation Results' : 'Observation / Test Results',
                    fieldLabel: category === "category3" ? 'Observation Results' : 'Observation / Test Results',
                    fieldType: 'SingleCodeField',
                    isArray: false,
                    isGroup: true
                  },


                },
              ]
            }],

            [
              'attachment', {
                formFields: [
                  <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'attachment',
                      fieldName: 'Add an Attachment',
                      fieldLabel: 'Add an Attachment',
                      fieldType: 'IndividualField',
                      isArray: false,
                      isGroup: false,
                      inputType: 'photo_upload'
                    },
                    data: ''
                  },

                ]
              }
            ]
            ].filter((ff: any) => {
              if (category !== 'category' && ff[0] === 'category') {
                return false;
              }


              return true;
            })
          }

        });
      })
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }
  }





















































  addAnotherFormerObservation(patientId: string, observationCategory: string | null = null) {
    let category = 'category'
    if (observationCategory) {
      switch (observationCategory) {
        case 'vitalSigns-exam':
          category = 'category2';
          break;
        case 'exam':
          category = 'category3'
          break;
        default:
          break;


      }
    }
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      forkJoin({
        practitioner: this.formFieldsDataService.getFormFieldSelectData('observation', 'practitioner'),
        category2: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category3: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        code: this.formFieldsDataService.getFormFieldSelectData('observation', 'code'),
      }).subscribe((g: any) => {
        console.log(g);
        const dRef = this.dialog.open(AddObservationComponent, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {
            observationformFields: [[
              'category', {
                formFields:
                  <FormFields[]>[
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
                        coding: g[category]['concept']
                      }
                      ,
                    },

                  ]
              }],
            ['name',
              {
                formFields:
                  <FormFields[]>[
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
                  ]

              }],
            ['value', {
              formFields: [
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
                    fieldName: 'Observation / Test Results',
                    fieldLabel: 'Observation / Test Results',
                    fieldType: 'SingleCodeField',
                    isArray: false,
                    isGroup: true
                  },


                },
              ]
            }]
            ]
          }

        });
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
          maxWidth: '650px',
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
  addServiceRequest(patientId: string | null) {
    // if (!patientId) {
    //   this.errorService.openandCloseError(`Patient ID is required to add a service request, 
    //     please start from the patient page to choose a patient and then visit the lab requests tab`);
    //   return;
    // }
    // if (this.globalEncounterState.hasOwnProperty(patientId)
    //   && this.globalEncounterState[patientId].getValue() == 'in-progress'
    // ) {
    // forkJoin({
    //   status: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'status'),
    //   intent: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'intent'),
    //   code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
    //   performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
    //   priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    // }).
    // 
    of(sample).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        const dRef = this.dialog.open(AddLabRequestsComponent, {
          maxHeight: '90vh',
          maxWidth: '650px',
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


    // } else {
    //   this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");

    // }
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
    // if (this.globalEncounterState.hasOwnProperty(patientId)
    //   && this.globalEncounterState[patientId].getValue() == 'in-progress'
    // ) {

    const dRef = this.dialog.open(AddMedicineRequestsComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      autoFocus: false,
      // data: {

      //   formMetaData: <formMetaData>{
      //     formName: 'Medication Request / Prescription',
      //     formDescription: "Use this form to record a medication request or prescription for the patient.",
      //     submitText: 'Submit Prescription',
      //   },
      //   formFields: <FormFields[]>[
      //     {

      //       generalProperties: {

      //         fieldApiName: 'status',
      //         fieldName: 'Status of Medication',
      //         fieldLabel: 'Status of Medication',
      //         value: 'active',
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },

      //         fieldType: 'SingleCodeField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.status

      //     },
      //     {

      //       generalProperties: {

      //         fieldApiName: 'intent',
      //         fieldName: 'Intent of Medication',
      //         fieldLabel: 'Intent of Medication',
      //         value: 'order',
      //         moreHint: "Do you intend that this medication should be ordered right away or is just a proposal",
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },

      //         fieldType: 'SingleCodeField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.intent

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'medication',
      //         fieldName: 'Medication / Drug',
      //         fieldLabel: 'Medication / Drug',
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },


      //         moreHint: "Search and choose a medication from the list",


      //         fieldType: 'CodeableConceptField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.medication

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'performerType',
      //         fieldName: 'Medication Administered By',
      //         fieldLabel: 'Medication Administered By',
      //         moreHint: "Who should administer the medication to the patient",
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },


      //         fieldType: 'CodeableConceptField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.performerType

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'reason',
      //         fieldName: 'Reason for Medication',
      //         fieldLabel: 'Reason for Medication',


      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },
      //         fieldType: 'CodeableConceptFieldFromBackEnd',




      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.reason

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'dosageInstruction',
      //         fieldName: 'Dosage Instruction',
      //         fieldLabel: 'Dosage Instruction',

      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },
      //         inputType: "textarea",



      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.performerType

      //     },


      //   ]
      // }
    })




    // } else {
    //   this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    // }


  }

  completeEncounter() { }


  addAllergy(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      const dRef = this.dialog.open(AddAllergyComponent, {
        maxHeight: '90vh',
        maxWidth: '650px',
        autoFocus: false,
        data: {
          patientId
        }
      });
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an allergy can be added for this patient");
    }

  }

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





  addTask(patientId: string) {
    this.dialog.open(TestingTasksComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      backdropClass: 'custom-backdrop',
      panelClass: 'custom-dialog-panel',
      autoFocus: false,
      data: {
        patientId
      }
    });
  }
  utilityService = inject(UtilityService);
  addInventory() {
    const InventoryDetailsFormFields = this.utilityService.convertFormFields(new Map([
      ['description', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'description',
              fieldName: "Product / Supply Description",
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
      }],
      ['brandName', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'brandName',
              fieldName: "Brand Name",
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

        ]
      }],

      ['status', {
        formFields: <FormFields[]>[
          <SingleCodeField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'status',
              fieldName: "Status",
              fieldType: 'SingleCodeField',
              inputType: 'text',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
            data: 'active | inactive | entered-in-error'.split(' | ')
          },
        ]
      }],

      ['baseUnit', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'baseUnit',
              fieldName: "Base Unit",
              fieldPlaceholder: "e.g. sachet, packet, ml e.t.c.",
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

        ]
      }],
      ['netContent', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'netContent',
              fieldName: "Quantity to be Stocked",
              fieldType: 'IndividualField',
              inputType: 'number',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
        ]
      }],
      ['expiry', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'expiry',
              fieldName: "Expiry Date For Expirable Products",
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
    ]));

    this.dialog.open(DynamicFormsV2Component, {
      data: {
        formMetaData: {
          formName: "Supplies Stock Form",
          formDescription: "Use this form to keep track of yoour stock supplies",
          showSubmitButton: true,
          submitText: "Submit"

        } as formMetaData,
        formFields: InventoryDetailsFormFields
      }
    })
  }

  addMedStock() {
    const InventoryDetailsFormFields = this.utilityService.convertFormFields(new Map([

      ['baseUnit', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'baseUnit',
              fieldName: "Base Unit",
              fieldPlaceholder: "e.g. sachet, packet, ml e.t.c.",
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

        ]
      }],
      ['netContent', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'netContent',
              fieldName: "Quantity to be Stocked",
              fieldType: 'IndividualField',
              inputType: 'number',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
        ]
      }],
      ['expiry', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'expiry',
              fieldName: "Expiry Date For Expirable Products",
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
    ]));

    this.dialog.open(DynamicFormsV2Component, {
      data: {
        formMetaData: {
          formName: "Medicine Supplies Stock Form",
          formDescription: "Use this form to record medicine stock supplies",
          showSubmitButton: true,
          submitText: "Submit"

        } as formMetaData,
        formFields: InventoryDetailsFormFields
      }
    })
  }

  addAnyObservation(patientId: string | null = null) {
    this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '900px',
      autoFocus: false,
      data: {
        isAnyCategory: true,

      }
    })
  }
}



