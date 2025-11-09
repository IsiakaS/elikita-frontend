import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData } from '../shared/dynamic-forms.interface2';
import { CommonModule } from '@angular/common';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
    selector: 'app-hospital-registration',
    standalone: true,
    imports: [CommonModule, DynamicFormsV2Component],
    templateUrl: './hospital-registration.component.html',
    styleUrl: './hospital-registration.component.scss'
})
export class HospitalRegistrationComponent implements OnInit {

    hospitalFormMetaData!: formMetaData;
    hospitalFormFields!: FormFields[];

    ngOnInit() {
        this.initializeForm();
    }

    initializeForm() {
        this.hospitalFormMetaData = {
            formName: "Hospital Registration",
            formDescription: "Register Your Healthcare Organization",
            submitText: "Register Organization",
        };

        this.hospitalFormFields = this.getHospitalFormFields();
    }

    getHospitalFormFields(): FormFields[] {
        return [
            <IndividualField>{
                generalProperties: {
                    fieldApiName: 'type',
                    fieldName: "Organization's Category",
                    fieldType: 'IndividualField',
                    fieldLabel: "Organization Category",
                    fieldPlaceholder: "Healthcare Provider, Insurance Company, Government",
                    isArray: false,
                    isGroup: false,
                    auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                    },
                },
            },
            <IndividualField>{
                generalProperties: {
                    fieldApiName: "name",
                    fieldName: "Name of Your Organization",
                    fieldType: "IndividualField",
                    fieldLabel: "Name of Your Organization",
                    fieldPlaceholder: "Name of Your Organization",
                    isArray: false,
                    isGroup: false,
                    auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                    }
                }
            },
            <IndividualField>{
                generalProperties: {
                    fieldApiName: "description",
                    fieldName: "Description of Your Organization",
                    fieldType: "IndividualField",
                    fieldLabel: "Description of Your Organization",
                    fieldPlaceholder: "Description of Your Organization",
                    inputType: 'textarea',
                    isArray: false,
                    isGroup: false,
                    auth: {
                        read: 'all',
                        write: 'doctor, nurse'
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
                    isArray: false,
                    isGroup: true,
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
                            value: "work",
                            isHidden: true,
                            isArray: false,
                            isGroup: false
                        },
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
                    isArray: false,
                    isGroup: true,
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
                            value: 'work',
                            isHidden: true,
                            isArray: false,
                            isGroup: false
                        },
                    },
                },
            },
            <GroupField>{
                generalProperties: {
                    fieldApiName: 'telecom',
                    fieldName: 'Other Contacts',
                    fieldLabel: 'Other Contacts',
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
                            value: 'work',
                            isArray: false,
                            isGroup: false
                        },
                    },
                },
            },
            <GroupField>(<unknown>{
                generalProperties: {
                    fieldApiName: 'qualification',
                    fieldName: "Qualifications",
                    fieldLabel: "Organization's Qualifications",
                    isArray: true,
                    isGroup: true,
                    auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                    }
                },
                keys: ['code', 'issuer'],
                groupFields: {
                    'code': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'qualification',
                            fieldName: "Qualifications",
                            fieldLabel: "Organization's Qualifications",
                            isArray: false,
                            isGroup: false,
                        }
                    },
                    'issuer_name': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'issuer_name',
                            fieldName: "Name of the Issuer of the Qualification",
                            fieldLabel: "Name of the Issuer of the Qualification",
                            isArray: false,
                            isGroup: false,
                        }
                    },
                    'issuer_website_link': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'issuer_website_link',
                            fieldName: "Website link of the Issuer of the Qualification",
                            fieldLabel: "Website link of the Issuer of the Qualification",
                            isArray: false,
                            isGroup: false,
                        }
                    },
                }
            })
        ];
    }

    onFormSubmit(formData: any) {
        console.log('Hospital Registration Data:', formData);
        // TODO: Add logic to submit to FHIR server
    }
}
