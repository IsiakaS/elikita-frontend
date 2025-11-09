import { Component, inject, ViewChild } from '@angular/core';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
//import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { forkJoin } from 'rxjs';
import { Group, Patient } from 'fhir/r4';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UploadUiComponent } from "../upload-ui/upload-ui.component";
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PatientDataReviewComponent, FieldEditEvent } from '../shared/patient-data-review/patient-data-review.component';


type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-patient-registration',
  imports: [DynamicFormsV2Component, RouterLink, RouterLinkActive,
    MatTabsModule, UploadUiComponent, CommonModule, MatButtonModule, MatCardModule,
    PatientDataReviewComponent],
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.scss'
})
export class PatientRegistrationComponent {
  designatedRegForm?: formMetaData
  designatedFormFields?: FormFields[];
  guardianFormFields?: FormFields[];
  guardianRegForm?: formMetaData;

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  formFieldsDataService = inject(FormFieldsSelectDataService);
  // errorService = inject(ErrorService);
  loadedFieldSelectData: any;
  ngOnInit() {

    // 'gender': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender&_format=json",
    //   'maritalStatus': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/marital-status&_format=json",
    //     'relationship': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/patient-contactrelationship&_format=json",
    //       'general_practitioner': "http://hapi.fhir.org/baseR5/Practitioner?_format=json",
    //         'contactPointUse': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-use&_format=json",
    //           'contactPointSystem': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-system&_format=json",
    forkJoin({
      gender: this.formFieldsDataService.getFormFieldSelectData('patient', 'gender'),
      maritalStatus: this.formFieldsDataService.getFormFieldSelectData('patient', 'maritalStatus'),
      relationship: this.formFieldsDataService.getFormFieldSelectData('patient', 'relationship'),
      general_Practitioner: this.formFieldsDataService.getFormFieldSelectData('patient', 'general_practitioner'),
      'contactPointUse': this.formFieldsDataService.getFormFieldSelectData('patient', 'contactPointUse'),
      'contactPointSystem': this.formFieldsDataService.getFormFieldSelectData('patient', 'contactPointSystem')
      // bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
      // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).pipe().subscribe({

      next: (g: any) => {
        this.designatedRegForm =
          <formMetaData>{
            formName: 'Patient Registration',
            formDescription: "Register Form",
            submitText: 'Next ',
          };
        this.designatedFormFields = [

          <IndividualField>{

            generalProperties: {


              fieldApiName: 'active',
              fieldName: 'is Record in Active Use',
              fieldLabel: 'is Record in Active Use',
              isHidden: true,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              value: true,
              inputType: "checkbox",
              isArray: false,

              isGroup: false
            },



          },
          <GroupField>{

            generalProperties: {

              fieldApiName: 'name',
              fieldName: 'Name',
              fieldLabel: 'Name',

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldType: "IndividualField",
              isArray: false,
              isGroup: true
            },
            keys: ["given", "family", "title", "otherNames"],
            groupFields: {
              title: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'title',
                  fieldName: 'Title',
                  fieldLabel: 'Title',
                  fieldPlaceholder: "Mr. Mrs.",

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: 'null'
              },
              family: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'family',
                  fieldName: 'Last Name / Surname',
                  fieldLabel: 'Last Name / Surname',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }

              },
              given: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'given',
                  fieldName: 'First Name',
                  fieldLabel: 'First Name',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }
              },
              otherNames: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'otherNames',
                  fieldName: 'Other Names',
                  fieldLabel: 'Other Names',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }

              }


            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'phone_telecom',
              fieldName: 'Phone Number',
              fieldLabel: 'Phone Number',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
              hiddenFields: ['system'], // Hide the system field in dialogs
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Phone Number ',
                  fieldLabel: 'Phone Number',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "phone",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  value: "mobile",
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'email_telecom',
              fieldName: 'Email',
              fieldLabel: 'Email',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
              hiddenFields: ['system'], // Hide the system field in dialogs
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Email ',
                  fieldLabel: 'Email',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "email",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  // isHidden: true,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'telecom',
              fieldName: 'Other Contacts',
              fieldLabel: 'Other Contacts',
              groupFieldsHint: 'Add other contact methods apart from email (e.g., phone, fax, SMS)',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },
            keys: ['value', 'system', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',
                  fieldHint: 'Add other contact methods apart from email (e.g., phone, fax, SMS)',


                  fieldName: 'Contact ',
                  fieldLabel: 'Contact',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <CodeField>{

            generalProperties: {
              fieldApiName: 'gender',
              fieldName: 'Gender',
              fieldLabel: 'Gender',
              fieldType: 'CodeField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              isArray: false,
              isGroup: false
            },
            data: g.gender?.map((item: any) => item[0].toUpperCase() + item.slice(1).toLowerCase())
          },
          <IndividualField>{

            generalProperties: {
              fieldApiName: 'birthDate',
              fieldName: 'Date of Birth',
              fieldLabel: 'Date of Birth',
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: false,
              isGroup: false
            }
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'address',
              fieldName: 'Address',
              fieldLabel: 'Address',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },



            keys: ['line', 'city', 'state', 'country', 'postalCode'],
            groupFields: {
              line: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'line',
                  fieldName: 'Adress Line',
                  fieldLabel: 'Address Line',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false


                }
              },

              city: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'city',
                  fieldName: 'City',
                  fieldLabel: 'City',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },

              state: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'state',
                  fieldName: 'State',
                  fieldLabel: 'State',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },
              postalCode: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'postalCode',
                  fieldName: 'Postal Code',
                  fieldLabel: 'Postal Code',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }

              },
              country: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'country',
                  fieldName: 'Country',
                  fieldLabel: 'Country',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },

            }
          },
          <CodeableConceptField>{
            generalProperties: {
              fieldApiName: 'maritalStatus',
              fieldName: 'Marital Status',
              fieldLabel: 'Marital Status',
              fieldType: 'CodeableConceptField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              isArray: false,
              isGroup: false
            },
            data: g.maritalStatus

          },


        ];
        this.guardianRegForm =
          <formMetaData>{
            formName: 'Guardian Registration',
            formDescription: "Guardian Register Form",
            submitText: ' Next ',
          };
        this.guardianFormFields = [
          <CodeableConceptField>{
            generalProperties: {
              fieldApiName: 'relationship',
              fieldName: 'Relationship to Patient',
              fieldLabel: 'Relationship to Patient',
              fieldType: 'CodeableConceptField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              isArray: false,
              isGroup: false
            },
            data: g.relationship
          },


          <GroupField>{

            generalProperties: {

              fieldApiName: 'name',
              fieldName: 'Guardian Name',
              fieldLabel: 'Guardian Name',

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldType: "IndividualField",
              isArray: false,
              isGroup: true
            },
            keys: ["given", "family", "title", "otherNames"],
            groupFields: {
              title: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'title',
                  fieldName: 'Title',
                  fieldLabel: 'Title',
                  fieldPlaceholder: "Mr. Mrs.",

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: 'null'
              },
              family: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'family',
                  fieldName: 'Last Name / Surname',
                  fieldLabel: 'Last Name / Surname',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }

              },
              given: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'given',
                  fieldName: 'First Name',
                  fieldLabel: 'First Name',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }
              },
              otherNames: <IndividualField>{
                generalProperties: {

                  fieldApiName: 'otherNames',
                  fieldName: 'Other Names',
                  fieldLabel: 'Other Names',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }

              }


            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'phone_telecom',
              fieldName: 'Guardian Phone Number',
              fieldLabel: 'Guardian Phone Number',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
              hiddenFields: ['system'], // Hide the system field in dialogs
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Phone Number ',
                  fieldLabel: 'Phone Number',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "phone",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'email_telecom',
              fieldName: 'Guardian Email',
              fieldLabel: 'Guardian Email',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
              hiddenFields: ['system'], // Hide the system field in dialogs
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Email ',
                  fieldLabel: 'Email',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "email",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'telecom',
              fieldName: 'Guardian Other Contacts',
              fieldLabel: 'Guardian Other Contacts',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },
            keys: ['value', 'system', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Contact ',
                  fieldLabel: 'Contact',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointSystem
              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },
                data: g.contactPointUse
              },



            },
          },
          <CodeField>{

            generalProperties: {
              fieldApiName: 'gender',
              fieldName: 'Guardian Gender',
              fieldLabel: 'Guardian Gender',
              fieldType: 'CodeField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              isArray: false,
              isGroup: false
            },
            data: g.gender
          },

          <GroupField>{

            generalProperties: {
              fieldApiName: 'address',
              fieldName: 'Guardian Address',
              fieldLabel: 'Guardian Address',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },



            keys: ['line', 'city', 'state', 'country', 'postalCode'],
            groupFields: {
              line: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'line',
                  fieldName: 'Adress Line',
                  fieldLabel: 'Address Line',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: true,
                  isGroup: false


                }
              },

              city: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'city',
                  fieldName: 'City',
                  fieldLabel: 'City',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },

              state: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'state',
                  fieldName: 'State',
                  fieldLabel: 'State',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },
              postalCode: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'postalCode',
                  fieldName: 'Postal Code',
                  fieldLabel: 'Postal Code',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }

              },
              country: <IndividualField>{
                generalProperties: {
                  fieldApiName: 'country',
                  fieldName: 'Country',
                  fieldLabel: 'Country',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  isArray: false,
                  isGroup: false
                }
              },

            }
          },


        ];

      },

      error: (err: any) => {
        this.errorService.openandCloseError("Error ocurred while preparing fields dropdowns for the form")
        console.log(err);
      }
    })
  }

  errorService = inject(ErrorService);
  dialog = inject(MatDialog);

  submittedData: any = null;
  fhirPatient: Patient | null = null;
  showForm: boolean = true;

  guardianSubmittedData: any = null;
  showGuardianForm: boolean = true;

  // Categorized fields for display
  simpleFields: any[] = [];
  arrayFields: any[] = [];

  onDesignatedFormSubmit(formData: any) {
    console.log('📋 Designated Form Submitted (Raw):', formData);

    // Transform to FHIR Patient (including guardian data if available)
    const transformedPatient = this.transformToFhirPatient(formData, this.guardianSubmittedData);
    this.fhirPatient = transformedPatient;
    this.submittedData = formData;
    this.showForm = false; // Hide form and show submitted data

    console.log('🔥 FHIR Patient:', transformedPatient);
  }

  /**
   * Handle field edit event from PatientDataReviewComponent
   * This is called in real-time when a field is edited in standalone mode
   */
  onFieldEdited(event: FieldEditEvent) {
    console.log('🔄 Field edited:', event);

    // Update the submittedData
    if (event.isArray && event.arrayIndex !== undefined) {
      this.submittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
    } else {
      this.submittedData[event.fieldApiName] = event.newValue;
    }

    // Re-transform to FHIR Patient with updated data (include guardian if exists)
    this.fhirPatient = this.transformToFhirPatient(this.submittedData, this.guardianSubmittedData);

    console.log('🔥 FHIR Patient updated:', this.fhirPatient);
  }

  /**
   * Handle navigate next event from PatientDataReviewComponent
   */
  onNavigateToNext() {
    // Re-transform patient data to FHIR before moving to next tab
    if (this.submittedData) {
      this.fhirPatient = this.transformToFhirPatient(this.submittedData, this.guardianSubmittedData);
      console.log('🔥 FHIR Patient updated before navigating to guardian tab:', this.fhirPatient);
    }

    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 1; // Move to Guardian/Dependent tab
    }
  }

  /**
   * Handle guardian/dependent form submission
   */
  onGuardianFormSubmit(formData: any) {
    console.log('📋 Guardian Form Submitted (Raw):', formData);
    this.guardianSubmittedData = formData;
    this.showGuardianForm = false;

    // Update FHIR Patient with guardian/contact information
    if (this.fhirPatient) {
      this.fhirPatient.contact = this.transformGuardianToFhirContact(formData);
      console.log('🔥 FHIR Patient updated with guardian info:', this.fhirPatient);
    }
  }

  /**
   * Handle guardian field edit event
   */
  onGuardianFieldEdited(event: FieldEditEvent) {
    console.log('🔄 Guardian field edited:', event);

    // Update the guardianSubmittedData
    if (event.isArray && event.arrayIndex !== undefined) {
      this.guardianSubmittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
    } else {
      this.guardianSubmittedData[event.fieldApiName] = event.newValue;
    }

    // Update FHIR Patient contact information
    if (this.fhirPatient) {
      this.fhirPatient.contact = this.transformGuardianToFhirContact(this.guardianSubmittedData);
      console.log('🔥 FHIR Patient contact updated:', this.fhirPatient.contact);
    }

    console.log('📝 Guardian data updated:', this.guardianSubmittedData);
  }

  /**
   * Handle navigate to next from guardian tab
   */
  onGuardianNavigateNext() {
    // Transform guardian data to FHIR contact format before moving to next tab
    if (this.guardianSubmittedData && this.fhirPatient) {
      this.fhirPatient.contact = this.transformGuardianToFhirContact(this.guardianSubmittedData);
      console.log('🔥 FHIR Patient updated with guardian/contact info:', this.fhirPatient);
    }

    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 2; // Move to Upload Photo & Documents tab
    }
  }

  /**
   * Transform form data to FHIR R4 Patient resource
   */
  transformToFhirPatient(formData: any, guardianData?: any): Patient {
    const patient: Patient = {
      resourceType: 'Patient',
      active: formData.active ?? true,
      name: formData.name ? [this.transformName(formData.name)] : [],
      gender: formData.gender?.toLowerCase() as 'male' | 'female' | 'other' | 'unknown',
      birthDate: formData.birthDate || undefined,
      maritalStatus: this.parseCodeableConcept(formData.maritalStatus),
      telecom: this.mergeTelecom(formData),
      address: formData.address || []
    };

    // Add guardian/contact information if available
    if (guardianData) {
      patient.contact = this.transformGuardianToFhirContact(guardianData);
    }

    return patient;
  }

  /**
   * Transform guardian/dependent data to FHIR Patient.contact format
   */
  transformGuardianToFhirContact(guardianData: any): any[] {
    if (!guardianData) return [];

    const contacts: any[] = [];

    // Guardian data might be an array or single object
    const guardianArray = Array.isArray(guardianData) ? guardianData : [guardianData];

    guardianArray.forEach((guardian: any) => {
      const contact: any = {};

      // Relationship
      if (guardian.relationship) {
        contact.relationship = [this.parseCodeableConcept(guardian.relationship)];
      }

      // Name
      if (guardian.name) {
        contact.name = this.transformName(guardian.name);
      }

      // Telecom (phone, email)
      const telecom: any[] = [];
      if (guardian.phone_telecom && Array.isArray(guardian.phone_telecom)) {
        telecom.push(...guardian.phone_telecom);
      }
      if (guardian.email_telecom && Array.isArray(guardian.email_telecom)) {
        telecom.push(...guardian.email_telecom);
      }
      if (guardian.telecom && Array.isArray(guardian.telecom)) {
        telecom.push(...guardian.telecom);
      }
      if (telecom.length > 0) {
        contact.telecom = telecom;
      }

      // Address
      if (guardian.address && Array.isArray(guardian.address)) {
        contact.address = guardian.address[0]; // FHIR contact.address is not an array
      }

      // Gender
      if (guardian.gender) {
        contact.gender = guardian.gender.toLowerCase() as 'male' | 'female' | 'other' | 'unknown';
      }

      // Organization (if guardian is an organization)
      if (guardian.organization) {
        contact.organization = {
          reference: guardian.organization
        };
      }

      // Period (if there's a time period for this contact)
      if (guardian.period) {
        contact.period = guardian.period;
      }

      contacts.push(contact);
    });

    return contacts;
  }

  /**
   * Transform name field
   */
  private transformName(name: any): any {
    return {
      use: 'official',
      prefix: name.title ? [name.title] : undefined,
      family: name.family,
      given: name.given ? [name.given, ...(name.otherNames ? [name.otherNames] : [])].filter(n => n) : []
    };
  }

  /**
   * Parse serialized CodeableConcept (format: "code$#$display$#$system")
   */
  private parseCodeableConcept(value: string): any {
    if (!value) return undefined;

    const parts = value.split('$#$');
    if (parts.length >= 3) {
      return {
        coding: [{
          code: parts[0],
          display: parts[1],
          system: parts[2]
        }],
        text: parts[1]
      };
    }
    return undefined;
  }

  /**
   * Merge all telecom arrays (phone, email, other contacts)
   */
  private mergeTelecom(formData: any): any[] {
    const telecom: any[] = [];

    // Add phone contacts
    if (formData.phone_telecom && Array.isArray(formData.phone_telecom)) {
      telecom.push(...formData.phone_telecom);
    }

    // Add email contacts
    if (formData.email_telecom && Array.isArray(formData.email_telecom)) {
      telecom.push(...formData.email_telecom);
    }

    // Add other contacts
    if (formData.telecom && Array.isArray(formData.telecom)) {
      telecom.push(...formData.telecom);
    }

    return telecom;
  }

  /**
   * Helper method for template - get object keys
   */
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  /**
   * Helper method for template - check if value is array
   */
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Format field value for display
   */
  formatFieldValue(field: any, data: any): string {
    const apiName = field.fieldApiName;

    // Handle birthDate
    if (apiName === 'birthDate' && data) {
      const date = new Date(data);
      return date.toLocaleDateString();
    }

    // Handle maritalStatus - extract display text only
    if (apiName === 'maritalStatus' && data) {
      if (typeof data === 'string' && data.includes('$#$')) {
        const parts = data.split('$#$');
        return parts[1] || data; // Return display value (middle part)
      }
      return data;
    }

    // Handle group fields like 'name'
    if (field.field.generalProperties.isGroup && data) {
      if (apiName === 'name') {
        const title = data.title || '';
        const given = data.given || '';
        const family = data.family || '';
        return `${title} ${given} ${family}`.trim();
      }
      return JSON.stringify(data);
    }

    // Handle simple fields
    return data ? String(data) : '';
  }


}
