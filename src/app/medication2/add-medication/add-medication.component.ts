import { Component, inject, ViewChild } from '@angular/core';
import { CodeableConceptField, CodeableConceptFieldFromBackEnd, FormFields, generalFieldsData, GroupField, IndividualField, IndividualReferenceField, SingleCodeField } from "../../shared/dynamic-forms.interface2"
import { MatTabsModule } from '@angular/material/tabs';
import { commonImports } from '../../shared/table-interface';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { forkJoin } from 'rxjs';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { ResourceDataReviewComponent } from '../../shared/resource-data-review/resource-data-review.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Bundle, CodeableConcept } from 'fhir/r4';
import { SuccessMessageComponent } from '../../shared/success-message/success-message.component';
import { FhirResourceTransformService } from '../../shared/fhir-resource-transform.service';
import { FhirResourceService } from '../../shared/fhir-resource.service';

@Component({
  selector: 'app-add-medication',
  imports: [MatTabsModule, ...commonImports, DynamicFormsV2Component, MatStepperModule, ResourceDataReviewComponent],
  templateUrl: './add-medication.component.html',
  styleUrl: './add-medication.component.scss'
})
export class AddMedicationComponent {
  formFieldService = inject(FormFieldsSelectDataService);
  fhirTransformService = inject(FhirResourceTransformService);
  fhirResourceService = inject(FhirResourceService);
  medicineDetailsFormFields?: any;
  medicineDetailsReviewData?: any;
  medicineReviewMessage?: string;
  @ViewChild('medicineDetailsForm') medicineDetailsForm?: DynamicFormsV2Component;
  InventoryDetailsFormFields?: any;
  PriceDetailsFormFields?: any;
  @ViewChild('inventoryDetailsForm') inventoryDetailsForm?: DynamicFormsV2Component;
  @ViewChild('priceDetailsForm') priceDetailsForm?: DynamicFormsV2Component;
  inventoryDetailsReviewData?: any;
  inventoryReviewMessage?: string;
  priceDetailsReviewData?: any;
  priceReviewMessage?: string;
  medicationFormFields?: Map<string, {
    formFields: FormFields[],
    [key: string]: any
  }>
  ngOnInit() {
    forkJoin({
      // doseForm: this.formFieldService.getFormFieldSelectData('medicine', 'doseForm'),
      code: this.formFieldService.getFormFieldSelectData('medicine', 'code'),
      item: this.formFieldService.getFormFieldSelectData('medicine', 'ingredientItem'),
      // strengthQuantity: this.formFieldService.getFormFieldSelectData('medicine', 'ingredientStrength'),
      // currency: this.formFieldService.getFormFieldSelectData('chargeItemDef', 'currency'),
    })
      .subscribe((g: any) => {
        this.medicationFormFields = new Map([[
          'code', {
            formFields: <FormFields[]>[
              <CodeableConceptFieldFromBackEnd>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'code',
                  fieldName: "Name / Brand Name",
                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  allowedOthers: true,
                  validations: [{
                    type: 'default',
                    isFunction: false,
                    name: 'required'
                  }],
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
          'form', {
            formFields: <FormFields[]>[
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'form',
                  fieldName: "Medicine Form",
                  fieldType: 'CodeableConceptField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  allowedOthers: true,
                  fieldPlaceholder: 'Select Medicine Form',
                  moreHint: 'e.g. tablet, capsule, syrup e.t.c.',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: [

                  'tablet$#$Tablet$#$https://elikita-server.daalitech.com',
                  'capsule$#$Capsule$#$https://elikita-server.daalitech.com',
                  'syrup$#$Syrup$#$https://elikita-server.daalitech.com',
                  'injection$#$Injection$#$https://elikita-server.daalitech.com',
                  'ointment$#$Ointment$#$https://elikita-server.daalitech.com',
                  'drop$#$Drop$#$https://elikita-server.daalitech.com',
                  'inhaler$#$Inhaler$#$https://elikita-server.daalitech.com',
                  'suppository$#$Suppository$#$https://elikita-server.daalitech.com',
                  'patch$#$Patch$#$https://elikita-server.daalitech.com',
                  'Others$#$Others$#$https://elikita-server.daalitech.com'


                ]
              },

            ]
          }],


        [
          'amount', {
            formFields: <FormFields[]>[
              <GroupField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'amount',
                  fieldName: "Amount in Package",
                  fieldLabel: "Amount in Package",
                  fieldPlaceholder: "500 mg per tablet",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: true,
                  groupFieldsHint: `Fill all four fields to express amount of the drug in the package.
                   Capture ratios like 500 mg per tablet. 
                   Another section captures each ingredient’s per-unit strength;
                    this section captures the total active amount per packaging unit.`,
                  moreHint: 'Another section captures each ingredient’s per-unit strength; this section captures the total active amount per packaging unit.',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                keys: ['numeratorValue', 'numeratorUnit', 'denominatorValue', 'denominatorUnit'],
                groupFields: {
                  'numeratorValue': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'numeratorValue',
                      fieldName: "Total Active Amount",
                      fieldLabel: "Total Active Amount",
                      fieldPlaceholder: '500',
                      fieldHint: 'Enter the total amount of all active substances in the package (e.g., 500 for 500 mg in the bottle).',
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
                  'numeratorUnit': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'numeratorUnit',
                      fieldName: "Amount Unit",
                      fieldLabel: "Amount Unit",
                      fieldPlaceholder: 'mg / g / mcg',
                      fieldHint: 'Unit of measure for the total active amount (mg, g, mcg, etc.).',
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
                  'denominatorValue': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'denominatorValue',
                      fieldName: "Package Count",
                      fieldLabel: "Package Count",
                      fieldPlaceholder: '1',
                      value: 1,
                      fieldHint: 'How many packaging units contain the stated total active amount (typically 1).',
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
                  'denominatorUnit': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'denominatorUnit',
                      fieldName: "Package Type",
                      fieldLabel: "Package Type",
                      fieldPlaceholder: 'bottle, capsule, blister pack, etc.',
                      fieldHint: 'Select the packaging type that holds the total active amount.',
                      fieldType: 'SingleCodeField',

                      isArray: false,
                      isGroup: false,
                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                      allowedOthers: true,
                    },
                    data: ['tablet', 'bottle', 'capsule', 'blister pack', 'sachet', 'vial', 'ampoule', 'spray', 'dropper', 'patch', 'tube', 'jar', 'box', 'bag', 'container', 'inhaler', 'suppository', 'puff', 'unit dose',]

                  }
                }
              },

            ]
          }],
        [
          'ingredient', {
            formFields: <FormFields[]>[
              <GroupField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'ingredient',
                  fieldName: "Ingredients",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: true,
                  isGroup: true,
                  allowedOthers: true,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                keys: ['item', 'isActive', 'ingredientNumeratorValue', 'ingredientNumeratorUnit', 'ingredientDenominatorValue', 'ingredientDenominatorUnit'],
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
                        allowedOthers: true,
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
                  'ingredientNumeratorValue': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'ingredientNumeratorValue',
                      fieldName: "Ingredient Strength Value",
                      fieldLabel: "Ingredient Strength Value",
                      fieldPlaceholder: 'e.g. 250',
                      fieldHint: 'Amount of this ingredient that contributes to the total active amount described above.',
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
                  'ingredientNumeratorUnit': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'ingredientNumeratorUnit',
                      fieldName: "Ingredient Unit Value",
                      fieldLabel: "Ingredient Unit Value",
                      fieldPlaceholder: 'mg / g / mcg',
                      fieldHint: 'Unit of measure for the strength amount above.',
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
                  'ingredientDenominatorValue': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'ingredientDenominatorValue',
                      fieldName: "Per Unit",
                      fieldLabel: "Per Unit",
                      fieldPlaceholder: '1',
                      // value: 1,
                      fieldHint: 'Number of units (tablet, capsule, mL, etc.) that contain the strength above.',
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
                  'ingredientDenominatorUnit': <SingleCodeField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'ingredientDenominatorUnit',
                      fieldName: "Per Unit Type",
                      fieldLabel: "Per Unit Type",
                      fieldPlaceholder: 'tablet, capsule, mL, etc.',
                      fieldHint: 'The unit that the ingredient strength applies to when summarizing the total package amount.',
                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false,
                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                      allowedOthers: true,
                    },
                    data: ['tablet', 'bottle', 'capsule', 'blister pack', 'sachet', 'vial', 'ampoule', 'spray', 'dropper', 'patch', 'tube', 'jar', 'box', 'bag', 'container', 'inhaler', 'suppository', 'puff', 'unit dose']
                  },

                }
              },
            ]
          }
        ],
        [
          'manufacturer', {
            formFields: <FormFields[]>[
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'manufacturer',
                  fieldName: "Manufacturer",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  fieldPlaceholder: 'Select or type manufacturer',
                  allowedOthers: true,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                // data: ['Manufacturer A', 'Manufacturer B', 'Manufacturer C', 'Others']
              },
            ]
          }
        ],



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
                      validations: [{
                        type: 'default',
                        isFunction: false,
                        name: 'required'
                      }],

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

          ['packageType', {
            formFields: <FormFields[]>[
              <CodeableConceptField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'packageType',
                  fieldName: "Package Type",
                  fieldType: 'CodeableConceptField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  fieldPlaceholder: 'Select packaging type',
                  validations: [{
                    type: 'default',
                    isFunction: false,
                    name: 'required'
                  }],
                  auth: {
                    read: 'all',
                    write: 'storeroom, pharmacist'
                  },
                },
                data: [
                  'BOX$#$Box$#$https://elikita-server.daalitech.com',
                  'BOTTLE$#$Bottle$#$https://elikita-server.daalitech.com',
                  'SACHET$#$Sachet$#$https://elikita-server.daalitech.com',
                  'AMP$#$Ampoule$#$https://elikita-server.daalitech.com',
                  'Others$#$Others$#$https://elikita-server.daalitech.com'
                ]
              },
            ]
          }],
          ['dispensableUnits', {
            formFields: <FormFields[]>[
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'dispensableUnits',
                  fieldName: "Dispensable Units",
                  fieldLabel: "Dispensable units per pack",
                  fieldType: 'IndividualField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                  validations: [{
                    type: 'default',
                    isFunction: false,
                    name: 'required'
                  }],
                  fieldPlaceholder: 'e.g. sachet, blister',
                  auth: {
                    read: 'all',
                    write: 'storeroom, pharmacist'
                  },
                },
              },
            ]
          }],
          ['totalAvailableUnits', {
            formFields: <FormFields[]>[
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'totalRemaining',
                  fieldName: "Total Available Units",
                  fieldLabel: "Total Available Units",
                  fieldType: 'IndividualField',
                  inputType: 'number',
                  validations: [{
                    type: 'default',
                    isFunction: false,
                    name: 'required'
                  }],
                  fieldHint: 'To get this value, you may need to multiply the number of packs in inventory by the dispensable units per pack.',
                  isArray: false,
                  isGroup: false,
                  fieldPlaceholder: 'Quantity Available in chosen units',
                  auth: {
                    read: 'all',
                    write: 'storeroom, pharmacist'
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
                        validations: [{
                          type: 'default',
                          isFunction: false,
                          name: 'required'
                        }],
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
                            fieldApiName: 'value',
                            fieldName: "Price",
                            fieldType: 'IndividualField',
                            inputType: 'number',
                            validations: [{
                              type: 'default',
                              isFunction: false,
                              name: 'required'
                            }],
                            isArray: false,
                            isGroup: false,
                            auth: {
                              read: 'all',
                              write: 'doctor, nurse'
                            },
                          },
                        },
                        'currency': <SingleCodeField>{
                          generalProperties: <generalFieldsData>{
                            fieldApiName: 'currency',
                            fieldName: "Currency",
                            value: "NGN",
                            fieldType: 'SingleCodeField',
                            inputType: 'text',
                            validations: [{
                              type: 'default',
                              isFunction: false,
                              name: 'required'
                            }],
                            isArray: false,
                            isGroup: false,
                            allowedOthers: true,
                            auth: {
                              read: 'all',
                              write: 'doctor, nurse'
                            },
                          },
                          data: ['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'ZAR']
                        },
                        'type': <SingleCodeField>{
                          generalProperties: <generalFieldsData>{
                            fieldApiName: 'type',
                            fieldName: "Type",
                            fieldType: 'SingleCodeField',
                            inputType: 'text',
                            value: 'base',
                            validations: [{
                              type: 'default',
                              isFunction: false,
                              name: 'required'
                            }],
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
          this.convertFormFields(priceFormFields);
      })

  }
  erroServ = inject(ErrorService);
  sn = inject(MatSnackBar);
  reviewMedicineDetails(stepper: MatStepper) {
    const review = this.captureFormReview(
      this.medicineDetailsForm,
      msg => this.medicineReviewMessage = msg,
      'Please complete required medicine details before reviewing.'
    );
    if (!review) return;
    this.medicineDetailsReviewData = review;
    // alert(JSON.stringify(this.medicineDetailsReviewData))
  }

  reviewInventoryDetails(stepper: MatStepper) {
    const review = this.captureFormReview(
      this.inventoryDetailsForm,
      msg => this.inventoryReviewMessage = msg,
      'Please complete required inventory details before reviewing.'
    );
    if (!review) return;
    this.inventoryDetailsReviewData = review;
  }

  reviewPriceDetails(stepper: MatStepper) {
    const review = this.captureFormReview(
      this.priceDetailsForm,
      msg => this.priceReviewMessage = msg,
      'Please complete required price details before reviewing.'
    );
    if (!review) return;
    this.priceDetailsReviewData = review;
  }

  continueAfterMedicineReview(stepper: MatStepper) {
    if (!this.medicineDetailsReviewData) return;
    this.medicineReviewMessage = undefined;
    stepper.next();
  }

  continueAfterInventoryReview(stepper: MatStepper) {
    if (!this.inventoryDetailsReviewData) return;
    this.inventoryReviewMessage = undefined;
    stepper.next();
  }

  onMedicineFieldEdited(evt: { fieldApiName: string; newValue: any }) {
    if (this.medicineDetailsForm?.aForm) {
      this.medicineDetailsForm.aForm.patchValue({ [evt.fieldApiName]: evt.newValue });
    }
    if (this.medicineDetailsReviewData) {
      this.medicineDetailsReviewData = {
        ...this.medicineDetailsReviewData,
        [evt.fieldApiName]: evt.newValue
      };
    }
  }

  onMedicineResourceUpdated(updated: any) {
    if (this.medicineDetailsForm?.aForm && updated) {
      this.medicineDetailsForm.aForm.patchValue(updated);
    }
    if (updated) {
      this.medicineDetailsReviewData = JSON.parse(JSON.stringify(updated));
    }
  }

  onInventoryFieldEdited(evt: { fieldApiName: string; newValue: any }) {
    if (this.inventoryDetailsForm?.aForm) {
      this.inventoryDetailsForm.aForm.patchValue({ [evt.fieldApiName]: evt.newValue });
    }
    if (this.inventoryDetailsReviewData) {
      this.inventoryDetailsReviewData = {
        ...this.inventoryDetailsReviewData,
        [evt.fieldApiName]: evt.newValue
      };
    }
  }

  onInventoryResourceUpdated(updated: any) {
    if (this.inventoryDetailsForm?.aForm && updated) {
      this.inventoryDetailsForm.aForm.patchValue(updated);
    }
    if (updated) {
      this.inventoryDetailsReviewData = JSON.parse(JSON.stringify(updated));
    }
  }

  onPriceFieldEdited(evt: { fieldApiName: string; newValue: any }) {
    if (this.priceDetailsForm?.aForm) {
      this.priceDetailsForm.aForm.patchValue({ [evt.fieldApiName]: evt.newValue });
    }
    if (this.priceDetailsReviewData) {
      this.priceDetailsReviewData = {
        ...this.priceDetailsReviewData,
        [evt.fieldApiName]: evt.newValue
      };
    }
  }

  onPriceResourceUpdated(updated: any) {
    if (this.priceDetailsForm?.aForm && updated) {
      this.priceDetailsForm.aForm.patchValue(updated);
    }
    if (updated) {
      this.priceDetailsReviewData = JSON.parse(JSON.stringify(updated));
    }
  }

  submitMedication() {
    console.log('submitMedication triggered', {
      medicine: this.medicineDetailsReviewData,
      inventory: this.inventoryDetailsReviewData,
      price: this.priceDetailsReviewData
    });

    if (!this.allReviewDataReady) {
      this.erroServ.openandCloseError('Please review all sections before submitting.');
      return;
    }

    console.log('All review data ready, building medication resource');
    const medicationResource = { ...this.buildMedicationResource(), manufacturer: { display: this.medicineDetailsReviewData?.manufacturer } };
    console.log('buildMedicationResource result', medicationResource);

    if (!medicationResource) {
      this.erroServ.openandCloseError('Medication details are missing or malformed.');
      return;
    }

    console.log('Building charge item resource for pricing');
    const chargeItemResource = this.buildChargeItemDefinitionResource(medicationResource);
    console.log('buildChargeItemDefinitionResource result', chargeItemResource);

    if (!chargeItemResource?.propertyGroup?.[0]?.priceComponent?.length) {
      this.erroServ.openandCloseError('Price definition requires at least one price component.');
      return;
    }

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { ...medicationResource, resourceType: 'Medication' },
          request: { method: 'POST', url: 'Medication' }
        },
        {
          resource: { ...chargeItemResource, resourceType: 'ChargeItemDefinition' },
          request: { method: 'POST', url: 'ChargeItemDefinition' }
        }
      ]
    };

    this.fhirResourceService.postBundle(bundle).subscribe({
      next: () => {
        this.sn.openFromComponent(SuccessMessageComponent, {
          data: { message: 'Medication, inventory and pricing saved successfully.' },
          duration: 3000
        });
        this.resetReviewState();
      },
      error: (err: any) => {
        console.error('Failed to submit medication bundle:', err);
        this.erroServ.openandCloseError('Failed to submit medication record. Please try again.');
      }
    });
  }

  get allReviewDataReady(): boolean {
    return !!this.medicineDetailsReviewData && !!this.inventoryDetailsReviewData && !!this.priceDetailsReviewData;
  }

  private captureFormReview(
    formComp: DynamicFormsV2Component | undefined,
    setMessage: (msg?: string) => void,
    validationMessage: string
  ): any | null {
    const form = formComp?.aForm;
    if (!form) return null;
    form.markAllAsTouched();
    if (!form.valid) {
      setMessage(validationMessage);
      return null;
    }
    setMessage(undefined);
    return JSON.parse(JSON.stringify(form.getRawValue()));
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

  private resetReviewState() {
    this.medicineDetailsReviewData = undefined;
    this.inventoryDetailsReviewData = undefined;
    this.priceDetailsReviewData = undefined;
    this.medicineReviewMessage = undefined;
    this.inventoryReviewMessage = undefined;
    this.priceReviewMessage = undefined;
  }

  private buildMedicationResource(): any | null {
    console.log('buildMedicationResource invoked with', this.medicineDetailsReviewData);
    if (!this.medicineDetailsReviewData) return null;
    const medication = this.fhirTransformService.transformValues('Medication', {
      ...this.medicineDetailsReviewData,

      ingredient: this.medicineDetailsReviewData.ingredient.map((each: any) => {
        return {
          itemCodeableConcept: each.item,
          isActive: each.active,
          strength: {
            numeratorValue: each.ingredientNumeratorValue,
            numeratorUnit: each.ingredientNumeratorUnit,
            denominatorValue: each.ingredientDenominatorValue,
            denominatorUnit: each.ingredientDenominatorUnit
          }
        }
      })
    });
    console.log('Medication after transformValues', medication);
    const inventoryExtension = this.buildInventoryExtension(this.inventoryDetailsReviewData);
    console.log('Inventory extension produced', inventoryExtension);
    if (inventoryExtension) {
      medication['extension'] = [...(medication['extension'] || []), ...inventoryExtension];
    }
    return medication;
  }

  private buildChargeItemDefinitionResource(medicationResource: any): any {
    console.log('buildChargeItemDefinitionResource invoked', medicationResource, this.priceDetailsReviewData);
    const priceData = this.priceDetailsReviewData || {};
    const components = (priceData.priceComponent || []).map((entry: any) => this.buildPriceComponent(entry)).filter(Boolean);
    console.log('Constructed price components', components);
    return {
      resourceType: 'ChargeItemDefinition',
      status: (priceData.status || 'draft').toString().trim().toLowerCase(),
      title: medicationResource?.code?.text || medicationResource?.code?.coding?.[0]?.display || 'Medication price definition',
      url: `https://elikita-server.daalitech.com/ChargeItemDefinition/medication-${Date.now()}`,
      publisher: 'Elikita Frontend',
      propertyGroup: [{ priceComponent: components }]
    };
  }

  private buildPriceComponent(entry: any): any | null {
    console.log('buildPriceComponent evaluating entry', entry);
    if (!entry) return null;
    const amountValue = Number(entry.value);
    if (Number.isNaN(amountValue)) {
      console.log('Skipping price component because value is not numeric', entry);
      return null;
    }
    const currency = (entry.currency || '').toString().trim();
    if (!currency) {
      console.log('Skipping price component because currency is missing', entry);
      return null;
    }
    const component: any = {
      amount: { value: amountValue, currency }
    };
    const typeText = (entry.type || entry.fieldLabel || '').toString().trim();
    if (typeText) {
      component.type = typeText;
    }
    const factorValue = Number(entry.factor);
    if (!Number.isNaN(factorValue)) {
      component.factor = factorValue;
    }
    console.log('Returning price component', component);
    return component;
  }
  // fhirtransformService = inject(FhirTransformService);
  private buildInventoryExtension(inventory: any): any | undefined {
    console.log('buildInventoryExtension received', inventory);
    if (!inventory) return undefined;
    const fields: Array<{
      url: string; valueString?: string; valueQuantity?: any,
      valueCodeableConcept?: CodeableConcept; valueInteger?: number
    }> = [];
    // this.appendInventoryExtension(fields, 'packageType', inventory.packageType);
    fields.push({
      url: 'packageType',
      valueCodeableConcept: this.fhirTransformService.toCodeableConcept(inventory.packageType)
    });
    this.appendInventoryExtension(fields, 'dispensableUnits', inventory.dispensableUnits);
    this.appendInventoryExtension(fields, 'totalRemaining', inventory.totalRemaining, true);
    console.log('Inventory extension fields before return', fields);
    if (!fields.length) return undefined;
    return fields.map(field => {
      return {
        ...field,
        url: 'https://elikita-server.daalitech.com/StructureDefinition/' + field.url,

      }
    })
      ;
  }

  private appendInventoryExtension(fields: Array<any>, key: string, value: any, preferQuantity = false) {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return;
    const numeric = Number(value);
    if (preferQuantity && !Number.isNaN(numeric)) {
      fields.push({
        url: key,
        valueQuantity: { value: numeric, unit: this.inventoryDetailsReviewData?.dispensableUnits || undefined }
      });
      return;
    }
    if (!Number.isNaN(numeric) && String(value) === String(numeric) && !preferQuantity) {
      fields.push({
        url: key,
        valueInteger: numeric
      });
      return;
    }
    fields.push({
      url: key,
      valueString: String(value)
    });
  }
}
