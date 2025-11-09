import { Component, inject } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { PriceFormatPipe } from "../shared/price-format.pipe";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeableConceptField, FormFields, generalFieldsData, GroupField, IndividualField, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { forkJoin } from 'rxjs';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { UtilityService } from '../shared/utility.service';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MatDialog } from '@angular/material/dialog';
import { ErrorService } from '../shared/error.service';
import { formMetaData } from '../shared/dynamic-forms.interface';
import { MatSelectModule } from '@angular/material/select';



@Component({
  selector: 'app-encounter-v2',
  imports: [...commonImports, PriceFormatPipe, CommonModule, FormsModule,

    MatSelectModule
  ],
  templateUrl: './encounter-v2.component.html',
  styleUrl: './encounter-v2.component.scss'
})
export class EncounterV2Component {
  medicine1UnitPrice = 5000;
  quantity1 = 1
  utilityService = inject(UtilityService);
  invOrClaim: string = "Invoice"

  increaseQ() {
    this.quantity1++;
  }
  decreaseQ() {
    if (this.quantity1 > 1) {
      this.quantity1--;
    }
  }

  chargesFormFields?: Map<string, {
    [key: string]: any,
    formFields: FormFields[]
  }>
  formFieldService = inject(FormFieldsSelectDataService);

  ngOnInit() {
    forkJoin({
      currency: this.formFieldService.getFormFieldSelectData('chargeItemDef', 'currency'),
      labCode: this.formFieldService.getFormFieldSelectData('serviceRequest', 'code'),
      code: this.formFieldService.getFormFieldSelectData('medication', 'code')

    })
      .subscribe((g: any) => {
        this.chargesFormFields = new Map([


          [
            'productServiceType', {
              formFields: <FormFields[]>[


                <GroupField>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'product_service_resourceType',
                    fieldName: "Product/Service Type",
                    fieldType: 'SingleCodeField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: true,

                  },
                  keys: ['product_service', 'other_product_service'],

                  groupFields: {
                    product_service:
                      <SingleCodeField>{
                        generalProperties: <generalFieldsData>{
                          auth: {
                            read: 'all',
                            write: 'doctor, nurse'
                          },
                          fieldApiName: 'product_service_resourceType',
                          fieldName: "Product/Service Type",
                          fieldType: 'SingleCodeField',
                          inputType: 'text',
                          isArray: false,
                          isGroup: false,
                          controllingField: [{

                            isAControlField: true,
                            controlledFieldDependencyId: "pp.pp1",
                            dependentFieldVisibilityTriggerValue: "Others"
                          }]

                        },
                        data: ['Consultation', 'Medication Dispense', 'Lab Test', 'Procedure', 'Imaging',
                          'Immunization', 'Medication Administration', 'Diagnostic Report', "Others"],
                      },




                    'other_product_service':
                      <IndividualField>{
                        generalProperties: <generalFieldsData>{
                          auth: {
                            read: 'all',
                            write: 'doctor, nurse'
                          },
                          fieldApiName: 'other_product_service',
                          fieldName: "Other Product/Service Type",
                          fieldType: 'IndividualField',
                          inputType: 'text',
                          isArray: false,
                          isGroup: false,

                        },
                        data: '',
                      },


                  }

                }
                // DiagnosticReport | ImagingStudy | Immunization | MedicationAdministration | MedicationDispense | MedicationRequest | Observation | Procedure | ServiceRequest | SupplyDelivery
              ],
            },
          ],
          [
            'code', {
              formFields: <FormFields[]>[
                <CodeableConceptField>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'medicine_code',
                    fieldName: "Medicine Name",
                    fieldType: 'CodeableConceptFieldFromBackEnd',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                  },
                  data: g.code
                },
              ]
            }
          ],
          //labcode
          ['labCode', {
            formFields: <FormFields[]>[{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'labCode',
                fieldName: "Lab Test Code",
                fieldType: 'CodeableConceptFieldFromBackEnd',
                inputType: 'text',
                isArray: false,
                isGroup: false,
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.labCode
            }]
          }],


          ['currency', {
            formFields: <FormFields[]>[{
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
            ],
          }],

          ['type', {
            formFields: <FormFields[]>[
              <SingleCodeField>{
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
              }]
          }],





          [
            'price', {
              formFields: <FormFields[]>[


                <IndividualField>{
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
                }





              ]
            }

          ],























        ])
      })

  }



  dialog = inject(MatDialog);
  errorService = inject(ErrorService);

  addAnyCharges() {
    if (this.chargesFormFields) {
      this.dialog.open(DynamicFormsV2Component, {
        width: '650px',
        data: {
          formMetaData: {
            formName: 'Patient Charges Form',
            formDescription: 'Form to add charges for a patient encounter',
            submitText: 'Add Charges',
            showSubmitButton: true

          } as formMetaData,
          formFields: this.utilityService.convertFormFields(this.chargesFormFields).filter(field => field.generalProperties.fieldApiName !== 'labCode' && field.generalProperties.fieldApiName !== 'medicine_code'),
          // Pass any data you need to the dialog here
        }
      }).afterClosed().subscribe(result => {
        if (result) {
          // Handle the result from the dialog
        }
      });
    }
  }

  addMedicationCharges() {
    if (this.chargesFormFields) {
      this.dialog.open(DynamicFormsV2Component, {
        width: '650px',
        data: {
          formMetaData: {
            formName: 'Medication Charges Form',
            formDescription: 'Form to add medication charges for a patient encounter',
            submitText: 'Add Medication Charges',
            showSubmitButton: true
          } as formMetaData,
          formFields: this.utilityService.convertFormFields(this.chargesFormFields).filter(field => field.generalProperties.fieldApiName !== 'product_service_resourceType' && field.generalProperties.fieldApiName !== 'labCode')
          // Pass any data you need to the dialog here
        }
      }).afterClosed().subscribe(result => {
        if (result) {
          // Handle the result from the dialog
        }
      });
    }
  }

  changePrice(prevVal: any = 0) {
    if (this.chargesFormFields) {
      this.dialog.open(DynamicFormsV2Component, {
        width: '650px',
        data: {
          formMetaData: {
            formName: 'Price Change Form',
            formDescription: '',
            submitText: prevVal == 0 ? 'Add Price' : 'Update Price',
            showSubmitButton: true
          } as formMetaData,
          formFields: this.utilityService.convertFormFields(this.chargesFormFields).filter((field) => {
            return field.generalProperties.fieldApiName !== 'product_service_resourceType' && field.generalProperties.fieldApiName !== 'labCode'
              && field.generalProperties.fieldApiName !== 'medicine_code'
          }
          ).map((field) => {
            if (field.generalProperties.fieldApiName === 'price') {
              field.generalProperties.value = prevVal;
            }
            return field;
          })
          // Pass any data you need to the dialog here
        }
      }).afterClosed().subscribe(result => {
        if (result) {
          // Handle the result from the dialog
        }
      });
    }

  }

  //addLabCharges() {
  addLabCharges() {
    if (this.chargesFormFields) {
      this.dialog.open(DynamicFormsV2Component, {
        width: '650px',
        data: {
          formMetaData: {
            formName: 'Lab Charges Form',
            formDescription: 'Form to add lab charges for a patient encounter',
            submitText: 'Add Lab Charges',
            showSubmitButton: true
          } as formMetaData,
          formFields: this.utilityService.convertFormFields(this.chargesFormFields).filter(field => field.generalProperties.fieldApiName !== 'product_service_resourceType' && field.generalProperties.fieldApiName !== 'medicine_code'),
          // Pass any data you need to the dialog here
        }
      }).afterClosed().subscribe(result => {
        if (result) {
          // Handle the result from the dialog
        }
      });
    }
  }

}