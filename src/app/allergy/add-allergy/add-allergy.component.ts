import { Component, inject } from '@angular/core';
import { CodeableConceptField, CodeableConceptFieldFromBackEnd, FormFields, generalFieldsData, GroupField, IndividualField, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { CodeableConcept, Group } from 'fhir/r5';
import { forkJoin } from 'rxjs';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { formMetaData } from '../../shared/dynamic-forms.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-allergy',
  imports: [DynamicFormsV2Component, MatButtonModule],
  templateUrl: './add-allergy.component.html',
  styleUrl: './add-allergy.component.scss'
})
export class AddAllergyComponent {
  allergyFields?: Map<string, {
    [key: string]: any;
  }>
  formFieldService = inject(FormFieldsSelectDataService);
  reactionEventsFormMetaData: formMetaData = {
    formName: 'Reaction Event Occurrence',
    formDescription: 'Form to capture details about the occurrence of an allergic reaction.',
    submitText: undefined,
    showSubmitButton: false,
  }
  ngOnInit() {

    // clinicalStatus: this.baseFunctionToRetrieveValueset,
    //     verificationStatus: this.baseFunctionToRetrieveValueset,
    //     type: this.baseFunctionToRetrieveValueset,
    //     category: this.baseFunctionToRetrieveValueset,
    //     expoureRoute: this.baseFunctionToRetrieveValueset,
    //     patient: (val: Bundle<Patient>) => {
    //       return val.entry?.map((e: BundleEntry<Patient>) => {
    //         const display = e.resource?.name?.[0].family || "unknown";
    //         const reference = "Patient/" + e.resource?.identifier?.[0].value;
    //         return reference + "$#$" + display
    //       })
    //     },
    //     code: (value: any) => {
    //       return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergyintolerance-code&_format=json";
    //     },
    //     manifestation: (val: any) => {
    //       return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/clinical-findings&_format=json";
    //     },
    //     reactionSubstance: (val: any) => {
    //       return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/substance-code&_format=json"
    //     }
    forkJoin({

      clinicalStatus: this.formFieldService.getFormFieldSelectData('allergy', 'clinicalStatus'),
      verificationStatus: this.formFieldService.getFormFieldSelectData('allergy', 'verificationStatus'),
      type: this.formFieldService.getFormFieldSelectData('allergy', 'type'),
      category: this.formFieldService.getFormFieldSelectData('allergy', 'category'),
      exposureRoute: this.formFieldService.getFormFieldSelectData('allergy', 'exposureRoute'),
      // patient: this.formFieldService.getFormFieldSelectData('allergy', 'patient'),
      code: this.formFieldService.getFormFieldSelectData('allergy', 'code'),
      manifestation: this.formFieldService.getFormFieldSelectData('allergy', 'manifestation'),
      reactionSubstance: this.formFieldService.getFormFieldSelectData('allergy', 'reactionSubstance'),


    })
      .subscribe((g: any) => {

        this.allergyFields = new Map<string, {
          [key: string]: any;
        }>([
          //allergy name
          ['allergyName', {
            'formFields': <FormFields[]>[
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'allergyName',
                  fieldName: "Allergy Name",
                  fieldPlaceholder: "e.g. Latex Allergy",
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
          ['clinicalStatus', {
            'formFields': <FormFields[]>[
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'clinicalStatus',
                  fieldName: "Clinical Status",
                  fieldType: 'CodeableConceptField',
                  value: "Active",
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.clinicalStatus
              },

            ]
          }],
          [
            'verificationStatus', {
              'formFields': <FormFields[]>[
                <CodeableConceptField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'verificationStatus',
                    fieldName: "Verification Status",
                    fieldType: 'CodeableConceptField',
                    value: "Confirmed",
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: g.verificationStatus
                },

              ]
            }],
          ['type', {
            'formFields': <FormFields[]>[
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'type',
                  fieldName: "Type",
                  fieldType: 'CodeableConceptField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  value: "allergy",
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.type
              },

            ]
          }],
          [
            'category', {
              'formFields': [
                <CodeableConceptField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'category',
                    fieldName: "Category",
                    fieldType: 'CodeableConceptField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: g.category
                },
              ]
            }
          ],
          [
            'criticality', {
              'formFields': <FormFields[]>[
                <SingleCodeField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'criticality',
                    fieldName: "Criticality",
                    fieldType: 'SingleCodeField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: 'low | high | unable-to-assess'.split(' | ')
                },
              ]

            }
          ],
          //onsetString
          [
            'onsetString', {
              'formFields': <FormFields[]>[
                <IndividualField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'onsetString',
                    fieldName: "Onset Date / Period / Age",
                    fieldPlaceholder: "e.g. 2023-01-01",
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
            },

          ],
          //last ocurrencce
          [
            'lastOccurrence', {
              'formFields': <FormFields[]>[
                <IndividualField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'lastOccurrence',
                    fieldName: "Last Occurrence",
                    fieldPlaceholder: "e.g. 2023-01-01",
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
            },
          ],
          //  note - other Details
          [
            'note', {
              'formFields': <FormFields[]>[
                <IndividualField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'note',
                    fieldName: "Other Details",
                    fieldPlaceholder: "e.g. Patient has a history of latex allergy",
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
            }
          ],
          [
            'reactionEvent', {
              'formFields': [
                <GroupField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'reactionEvent',
                    fieldName: "Reaction Event",
                    fieldType: 'IndividualField',
                    isArray: false,
                    isGroup: true,

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  keys: ['manifestation', 'severity', 'exposureRoute', 'substance', 'severity', 'description', 'onset'],
                  groupFields: {

                    'substance': <CodeableConceptFieldFromBackEnd>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'substance',
                        fieldName: "Substance",
                        fieldHint: "The Substance that caused the reaction",

                        fieldType: 'CodeableConceptFieldFromBackEnd',

                        isArray: false,
                        isGroup: false,

                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: g.reactionSubstance

                    },
                    'manifestation': <CodeableConceptFieldFromBackEnd>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'manifestation',
                        fieldName: "Symptoms / Signs / Manifestation",
                        fieldType: 'CodeableConceptFieldFromBackEnd',
                        isArray: false,
                        isGroup: false,

                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: g.manifestation
                    },
                    'severity': <SingleCodeField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'severity',
                        fieldName: "Severity",
                        fieldType: 'SingleCodeField',
                        inputType: 'text',
                        isArray: false,
                        isGroup: false,

                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: 'mild | moderate | severe'.split(' | ')
                    },

                    'exposureRoute': <CodeableConceptField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'exposureRoute',
                        fieldName: "Exposure Route",
                        fieldType: 'CodeableConceptField',
                        inputType: 'text',
                        isArray: false,
                        isGroup: false,

                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: g.exposureRoute
                    },

                    'description': <IndividualField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'description',
                        fieldName: "Description",
                        fieldPlaceholder: "e.g. Mild rash",
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
                    'onset': <IndividualField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'onset',
                        fieldName: "Onset Date/Time",
                        fieldHint: "The date or time when the reaction started",
                        fieldPlaceholder: "e.g. 2023-01-01",
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


                  }
                }
              ]
            }

          ],


          //severity mild | moderate | severe
          [
            'severity', {
              'formFields': <FormFields[]>[
                <SingleCodeField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'severity',
                    fieldName: "Severity",
                    fieldType: 'SingleCodeField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: 'mild | moderate | severe'.split(' | ')
                },
              ]
            }
          ]


        ]


        );

        let toUseFields: any[] = [];
        let reactionEventFields = this.allergyFields?.get('reactionEvent') || {};
        const allFieldsExceptReaction = Array.from(this.allergyFields?.entries() || []).filter(([key, value]) => key !== 'reactionEvent');
        allFieldsExceptReaction.forEach(([key, value]) => {
          toUseFields = [...toUseFields, ...value['formFields']];
        })
        console.log(reactionEventFields, 'reactionEventFields');
        reactionEventFields['formFields'].forEach((field: any) => {
          if (!this.reactionEventFormFields) {
            this.reactionEventFormFields = [];
          }

          this.reactionEventFormFields = [...this.reactionEventFormFields, field];
          console.log(field, 'field');
          console.log(this.reactionEventFormFields, 'this.reactionEventFormFields');
        })

        this.allformFields = toUseFields
      });

  }
  allformFields?: FormFields[]
  reactionEventFormFields?: FormFields[];

}
