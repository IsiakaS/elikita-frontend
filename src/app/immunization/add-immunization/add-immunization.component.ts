import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { routes } from '../../app.routes';
import { CodeableConceptField, FormFields, generalFieldsData, GroupField, IndividualField, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { CodeableConcept, Group } from 'fhir/r5';
import { UtilityService } from '../../shared/utility.service';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";

@Component({
  selector: 'app-add-immunization',
  imports: [DynamicFormsV2Component],
  templateUrl: './add-immunization.component.html',
  styleUrl: './add-immunization.component.scss'
})
export class AddImmunizationComponent {
  // statusReason: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-status-reason&_format=json",
  //     vaccineCode: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/vaccine-code&_format=json",
  //     informationSource: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-origin&_format=json",
  //     site: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-site&_format=json",
  //     route: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-route&_format=json",
  //     reason: "htt


  // this.allergyFields = new Map<string, {
  //         [key: string]: any;
  //       }>([
  //         //allergy name
  //         ['allergyName', {
  //           'formFields': <FormFields[]>[
  //             <IndividualField>{
  //               generalProperties: <generalFieldsData>{
  //                 fieldApiName: 'allergyName',
  //                 fieldName: "Allergy Name",
  //                 fieldPlaceholder: "e.g. Latex Allergy",
  //                 fieldType: 'IndividualField',
  //                 inputType: 'text',
  //                 isArray: false,
  //                 isGroup: false,

  //                 auth: {
  //                   read: 'all',
  //                   write: 'doctor, nurse'
  //                 },
  //               },

  //             },

  //           ]
  //         }],
  //         ['clinicalStatus', {
  //           'formFields': <FormFields[]>[
  //             <CodeableConceptField>{
  //               generalProperties: <generalFieldsData>{
  //                 fieldApiName: 'clinicalStatus',
  //                 fieldName: "Clinical Status",
  //                 fieldType: 'CodeableConceptField',
  //                 value: "Active",
  //                 inputType: 'text',
  //                 isArray: false,
  //                 isGroup: false,

  //                 auth: {
  //                   read: 'all',
  //                   write: 'doctor, nurse'
  //                 },
  //               },
  //               data: g.clinicalStatus
  //             },

  //           ]
  //         }],
  //         [
  //           'verificationStatus', {
  //             'formFields': <FormFields[]>[
  //               <CodeableConceptField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'verificationStatus',
  //                   fieldName: "Verification Status",
  //                   fieldType: 'CodeableConceptField',
  //                   value: "Confirmed",
  //                   inputType: 'text',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },
  //                 data: g.verificationStatus
  //               },

  //             ]
  //           }],
  //         ['type', {
  //           'formFields': <FormFields[]>[
  //             <CodeableConceptField>{
  //               generalProperties: <generalFieldsData>{
  //                 fieldApiName: 'type',
  //                 fieldName: "Type",
  //                 fieldType: 'CodeableConceptField',
  //                 inputType: 'text',
  //                 isArray: false,
  //                 isGroup: false,
  //                 value: "allergy",
  //                 auth: {
  //                   read: 'all',
  //                   write: 'doctor, nurse'
  //                 },
  //               },
  //               data: g.type
  //             },

  //           ]
  //         }],
  //         [
  //           'category', {
  //             'formFields': [
  //               <CodeableConceptField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'category',
  //                   fieldName: "Category",
  //                   fieldType: 'CodeableConceptField',
  //                   inputType: 'text',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },
  //                 data: g.category
  //               },
  //             ]
  //           }
  //         ],
  //         [
  //           'criticality', {
  //             'formFields': <FormFields[]>[
  //               <SingleCodeField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'criticality',
  //                   fieldName: "Criticality",
  //                   fieldType: 'SingleCodeField',
  //                   inputType: 'text',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },
  //                 data: 'low | high | unable-to-assess'.split(' | ')
  //               },
  //             ]

  //           }
  //         ],
  //         //onsetString
  //         [
  //           'onsetString', {
  //             'formFields': <FormFields[]>[
  //               <IndividualField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'onsetString',
  //                   fieldName: "Onset Date / Period / Age",
  //                   fieldPlaceholder: "e.g. 2023-01-01",
  //                   fieldType: 'IndividualField',
  //                   inputType: 'text',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },

  //               },

  //             ]
  //           },

  //         ],
  //         //last ocurrencce
  //         [
  //           'lastOccurrence', {
  //             'formFields': <FormFields[]>[
  //               <IndividualField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'lastOccurrence',
  //                   fieldName: "Last Occurrence",
  //                   fieldPlaceholder: "e.g. 2023-01-01",
  //                   fieldType: 'IndividualField',
  //                   inputType: 'datetime-local',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },

  //               },

  //             ]
  //           },
  //         ],
  //         //  note - other Details
  //         [
  //           'note', {
  //             'formFields': <FormFields[]>[
  //               <IndividualField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'note',
  //                   fieldName: "Other Details",
  //                   fieldPlaceholder: "e.g. Patient has a history of latex allergy",
  //                   fieldType: 'IndividualField',
  //                   inputType: 'textarea',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },

  //               },

  //             ]
  //           }
  //         ],
  //         [
  //           'reactionEvent', {
  //             'formFields': [
  //               <GroupField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'reactionEvent',
  //                   fieldName: "Reaction Event",
  //                   fieldType: 'IndividualField',
  //                   isArray: false,
  //                   isGroup: true,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },
  //                 keys: ['manifestation', 'severity', 'exposureRoute', 'substance', 'severity', 'description', 'onset'],
  //                 groupFields: {

  //                   'substance': <CodeableConceptFieldFromBackEnd>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'substance',
  //                       fieldName: "Substance",
  //                       fieldHint: "The Substance that caused the reaction",

  //                       fieldType: 'CodeableConceptFieldFromBackEnd',

  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },
  //                     data: g.reactionSubstance

  //                   },
  //                   'manifestation': <CodeableConceptFieldFromBackEnd>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'manifestation',
  //                       fieldName: "Symptoms / Signs / Manifestation",
  //                       fieldType: 'CodeableConceptFieldFromBackEnd',
  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },
  //                     data: g.manifestation
  //                   },
  //                   'severity': <SingleCodeField>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'severity',
  //                       fieldName: "Severity",
  //                       fieldType: 'SingleCodeField',
  //                       inputType: 'text',
  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },
  //                     data: 'mild | moderate | severe'.split(' | ')
  //                   },

  //                   'exposureRoute': <CodeableConceptField>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'exposureRoute',
  //                       fieldName: "Exposure Route",
  //                       fieldType: 'CodeableConceptField',
  //                       inputType: 'text',
  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },
  //                     data: g.exposureRoute
  //                   },

  //                   'description': <IndividualField>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'description',
  //                       fieldName: "Description",
  //                       fieldPlaceholder: "e.g. Mild rash",
  //                       fieldType: 'IndividualField',
  //                       inputType: 'textarea',
  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },

  //                   },
  //                   'onset': <IndividualField>{
  //                     generalProperties: <generalFieldsData>{
  //                       fieldApiName: 'onset',
  //                       fieldName: "Onset Date/Time",
  //                       fieldHint: "The date or time when the reaction started",
  //                       fieldPlaceholder: "e.g. 2023-01-01",
  //                       fieldType: 'IndividualField',
  //                       inputType: 'datetime-local',
  //                       isArray: false,
  //                       isGroup: false,

  //                       auth: {
  //                         read: 'all',
  //                         write: 'doctor, nurse'
  //                       },
  //                     },

  //                   },


  //                 }
  //               }
  //             ]
  //           }

  //         ],


  //         //severity mild | moderate | severe
  //         [
  //           'severity', {
  //             'formFields': <FormFields[]>[
  //               <SingleCodeField>{
  //                 generalProperties: <generalFieldsData>{
  //                   fieldApiName: 'severity',
  //                   fieldName: "Severity",
  //                   fieldType: 'SingleCodeField',
  //                   inputType: 'text',
  //                   isArray: false,
  //                   isGroup: false,

  //                   auth: {
  //                     read: 'all',
  //                     write: 'doctor, nurse'
  //                   },
  //                 },
  //                 data: 'mild | moderate | severe'.split(' | ')
  //               },
  //             ]
  //           }
  //         ]


  //       ]


  //       );

  formFieldService = inject(FormFieldsSelectDataService);
  immunizationForm?: Map<string, {
    [key: string]: any,
    formFields: FormFields[];
  }>

  ngOnInit() {
    forkJoin({
      statusReason: this.formFieldService.getFormFieldSelectData('immunization', 'statusReason'),
      vaccineCode: this.formFieldService.getFormFieldSelectData('immunization', 'vaccineCode'),
      informationSource: this.formFieldService.getFormFieldSelectData('immunization', 'informationSource'),
      site: this.formFieldService.getFormFieldSelectData('immunization', 'site'),
      route: this.formFieldService.getFormFieldSelectData('immunization', 'route'),
      reason: this.formFieldService.getFormFieldSelectData('immunization', 'reason'),
      targetDisease: this.formFieldService.getFormFieldSelectData('immunization', 'targetDisease'),
    }).subscribe((g: any) => {

      this.immunizationForm = new Map<string, {
        [key: string]: any,
        formFields: FormFields[];
      }>([[
        'status', {
          formFields: <FormFields[]>[
            <GroupField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'status',
                fieldName: "Status",
                fieldType: 'IndividualField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              keys: ['statusReason', 'status'],
              groupFields: {
                'status': <SingleCodeField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'status',
                    fieldName: "Status",
                    fieldType: 'SingleCodeField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    controllingField: [{
                      isAControlField: true,
                      dependentFieldVisibilityTriggerValue: 'not-done',
                      controlledFieldDependencyId: 'status.statusReason'
                    }],

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: 'completed | entered-in-error | not-done'.split(' | ')
                },
                'statusReason': <SingleCodeField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'statusReason',
                    fieldName: "Reason for Not Done",
                    fieldPlaceholder: "Reason Why the immunization was not done",
                    fieldType: 'SingleCodeField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    dependence_id: "status.statusReason",
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: g.statusReason
                }

              },
            },


          ]
        }
      ],




      [
        'vaccineCode', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'vaccineCode',
                fieldName: "Vaccine Code",
                fieldType: 'CodeableConceptField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.vaccineCode
            },
          ]
        }


      ]







        ,


      [
        'administeredProduct', {
          formFields: <FormFields[]>[
            <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'administeredProduct',
                fieldName: "Administered Product",
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
        }

      ]






        ,




      [
        'occurrenceDateTime', {
          formFields: <FormFields[]>[
            <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'occurrenceDateTime',
                fieldName: "Occurrence Date/Time",
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
        }

      ]











        ,


      [
        'informationSource', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'informationSource',
                fieldName: "Information Source",
                fieldType: 'CodeableConceptField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.informationSource
            },
          ]

        }

      ]







        ,





      [

        'bodySite', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'bodySite',
                fieldName: "Body Site",
                fieldPlaceholder: "e.g. Left Arm",
                fieldType: 'CodeableConceptField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.site
            },
          ]
        }
      ]











        ,

      [

        'route', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'route',
                fieldName: "Route",
                fieldType: 'CodeableConceptField',
                fieldPlaceholder: "e.g. Intramuscular",
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.route
            },
          ]
        }
      ]















        ,

      [
        'doseQuantity', {
          formFields: <FormFields[]>[
            <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'doseQuantity',
                fieldName: "Dose Quantity",
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
        }
      ]






        ,


      [
        'targetDisease', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'targetDisease',
                fieldName: "Target Disease",
                fieldType: 'CodeableConceptField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.targetDisease
            },
          ]
        }

      ]










        ,


      [
        'reason', {
          formFields: <FormFields[]>[
            <CodeableConceptField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'reason',
                fieldName: "Reason",
                fieldType: 'CodeableConceptField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.reason
            },
          ]
        }


      ]















        ,













      ])


      this.formFieldsToUse = this.utilityService.convertFormFields(this.immunizationForm);

    });
  }
  utilityService = inject(UtilityService);
  formFieldsToUse?: any[];
}
