import { Component, inject } from '@angular/core';
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
import { Group } from 'fhir/r5';


type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-patient-registration',
  imports: [DynamicFormsV2Component],
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.scss'
})
export class PatientRegistrationComponent {
  designatedRegForm?: formMetaData
  designatedFormFields?: FormFields[];

  formFieldsDataService = inject(FormFieldsSelectDataService);
  // errorService = inject(ErrorService);

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
            submitText: 'Submit Form',
          };
        this.designatedFormFields = [

          // <IndividualField>{

          //   generalProperties: {

          //     fieldApiName: 'active',
          //     fieldName: 'is Record in Active Use',
          //     fieldLabel: 'is Record in Active Use',

          //     auth: {
          //       read: 'all',
          //       write: 'doctor, nurse'
          //     },
          //     value: true,
          //     inputType: "checkbox",
          //     isArray: false,
          //     isGroup: false
          //   },


          // },
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
                  fieldName: 'Last Name/Surname',
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
              fieldApiName: 'telecom',
              fieldName: 'Contacts',
              fieldLabel: 'Contacts',
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
            data: g.gender
          },
          <IndividualField>{

            generalProperties: {
              fieldApiName: 'birthDate',
              fieldName: 'Date of Birth',
              fieldLabel: 'Date of Birth',
              fieldType: 'IndividualField',
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
      },

      error: (err: any) => {
        this.errorService.openandCloseError("Error ocurred while preparing fields dropdowns for the form")
        console.log(err);
      }
    })
  }

  errorService = inject(ErrorService);




}
