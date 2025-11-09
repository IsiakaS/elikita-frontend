import { Component, inject } from '@angular/core';
import { CodeableConceptField, CodeableConceptFieldFromBackEnd, FormFields, generalFieldsData, GroupField, IndividualField, IndividualReferenceField, SingleCodeField } from "../../shared/dynamic-forms.interface2"
import { MatTabsModule } from '@angular/material/tabs';
import { commonImports } from '../../shared/table-interface';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { forkJoin } from 'rxjs';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-add-medication',
  imports: [MatTabsModule, ...commonImports, DynamicFormsV2Component, MatStepperModule],
  templateUrl: './add-medication.component.html',
  styleUrl: './add-medication.component.scss'
})
export class AddMedicationComponent {
  formFieldService = inject(FormFieldsSelectDataService);
  medicineDetailsFormFields?: any;
  InventoryDetailsFormFields?: any;
  PriceDetailsFormFields?: any;
  medicationFormFields?: Map<string, {
    formFields: FormFields[],
    [key: string]: any
  }>
  ngOnInit() {
    forkJoin({
      doseForm: this.formFieldService.getFormFieldSelectData('medicine', 'doseForm'),
      code: this.formFieldService.getFormFieldSelectData('medicine', 'code'),
      item: this.formFieldService.getFormFieldSelectData('medicine', 'ingredientItem'),
      strengthQuantity: this.formFieldService.getFormFieldSelectData('medicine', 'ingredientStrength'),
      currency: this.formFieldService.getFormFieldSelectData('chargeItemDef', 'currency'),
    })
      .subscribe((g: any) => {
        this.medicationFormFields = new Map([[
          'code', {
            formFields: <FormFields[]>[
              <CodeableConceptFieldFromBackEnd>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'code',
                  fieldName: "Name",
                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                },

                data: g.code
              },
            ]
          }],
        [
          'status', {
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
        [
          'doseForm', {
            formFields: <FormFields[]>[
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'doseForm',
                  fieldName: "Dose Form",
                  fieldType: 'CodeableConceptField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: g.doseForm
              },

            ]
          }], [
          'totalVolume', {
            formFields: <FormFields[]>[
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'totalVolume',
                  fieldName: "Total Volume",
                  fieldPlaceholder: " 2 / 2 capsules / 5 ml e.t.c.",
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
        [
          'ingredient', {
            formFields: <FormFields[]>[
              <GroupField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'ingredients',
                  fieldName: "Ingredients",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: true,
                  isGroup: true,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                keys: ['item', 'isActive', 'strengthQuantity'],
                groupFields: {
                  'item':
                    <CodeableConceptFieldFromBackEnd>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'item',
                        fieldName: "Name",
                        fieldType: 'CodeableConceptFieldFromBackEnd',
                        inputType: 'text',
                        isArray: false,
                        isGroup: false,

                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: g.item
                    },
                  'isActive': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'active',
                      fieldName: "Active Ingredient?",

                      fieldType: 'IndividualField',
                      inputType: 'toggle',
                      isArray: false,
                      isGroup: false,

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                    },
                  },
                  'strengthQuantity': <CodeableConceptField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'strengthQuantity',
                      fieldName: "Strength",
                      fieldType: 'CodeableConceptField',
                      inputType: 'text',
                      isArray: false,
                      isGroup: false,

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                    },
                    data: g.strengthQuantity
                  },
                }
              },
            ]
          }
        ]


          ,

        [
          'batch', {
            formFields: <FormFields[]>[
              <GroupField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'batch',
                  fieldName: "Batch",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: true,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                keys: ['lotNumber', 'expirationDate'],
                groupFields: {
                  'lotNumber': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'lotNumber',
                      fieldName: "Batch Id",
                      fieldType: 'IndividualField',
                      inputType: 'hidden',
                      isArray: false,
                      isGroup: false,

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                    },
                  },
                  'expirationDate': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'expirationDate',
                      fieldName: "Expiration Date",
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
              },
            ]
          }
        ]





          ,
        ]
        );
        this.medicineDetailsFormFields = this.convertFormFields(this.medicationFormFields!)

        //         InventoryFields = ['status', 'brandName', 'description',
        // 'baseUnit',
        // 'netContent', 'expiry'
        //         ]
        this.InventoryDetailsFormFields = this.convertFormFields(new Map([
          ['description', {
            formFields: <FormFields[]>[
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'description',
                  fieldName: "Medicine Description",
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
                  fieldName: "Status?",
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
                  fieldPlaceholder: "e.g. tablet, capsule, ml e.t.c.",
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
                  fieldName: "Expiry",
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

        const priceFormFields = new Map<string, { [key: string]: any, formFields: FormFields[] }>(
          [
            [
              'status',
              {
                formFields:
                  <FormFields[]>[
                    <SingleCodeField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'status',
                        fieldName: "Status",
                        fieldType: 'SingleCodeField',
                        inputType: 'text',
                        isArray: false,
                        isGroup: false,
                        value: 'active',
                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      data: 'draft | active | retired | unknown'.split(' | ')
                    },
                  ]
              }
            ]
            ,
            [
              'priceComponent', {
                formFields:
                  <FormFields[]>[
                    <GroupField>{
                      generalProperties: <generalFieldsData>{
                        fieldApiName: 'priceComponent',
                        fieldName: "Price Component",
                        fieldType: 'IndividualField',
                        isArray: true,
                        isGroup: true,
                        auth: {
                          read: 'all',
                          write: 'doctor, nurse'
                        },
                      },
                      keys: ['value', 'currency', 'type'],
                      groupFields: {
                        'value': <IndividualField>{
                          generalProperties: <generalFieldsData>{
                            fieldApiName: 'price',
                            fieldName: "Price",
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
                        'currency': <CodeableConceptField>{
                          generalProperties: <generalFieldsData>{
                            fieldApiName: 'currency',
                            fieldName: "Currency",
                            value: "NGN",
                            fieldType: 'CodeableConceptField',
                            inputType: 'text',
                            isArray: false,
                            isGroup: false,
                            auth: {
                              read: 'all',
                              write: 'doctor, nurse'
                            },
                          },
                          data: g.currency
                        },
                        'type': <SingleCodeField>{
                          generalProperties: <generalFieldsData>{
                            fieldApiName: 'type',
                            fieldName: "Type",
                            fieldType: 'SingleCodeField',
                            inputType: 'text',
                            value: 'base',
                            isArray: false,
                            isGroup: false,
                            auth: {
                              read: 'all',
                              write: 'doctor, nurse'
                            },
                          },
                          data: 'base | surcharge | deduction | tax'.split(' | ')
                        }

                      }
                    }

                  ]
              }

            ]


            ,


          ]
        );

        this.PriceDetailsFormFields =
          this.convertFormFields(priceFormFields)



      })


  }

  convertFormFields(e: Map<string, {
    formFields: FormFields[],
    [key: string]: any
  }>): FormFields[] {
    const fieldsToReturn: FormFields[] = [];
    Array.from(e).forEach((f) => {
      f[1].formFields.forEach((g) => {
        fieldsToReturn.push(g);
      })
    })
    return fieldsToReturn
  }



}
