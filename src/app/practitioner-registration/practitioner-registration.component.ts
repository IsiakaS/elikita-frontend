
// Type aliases for FHIR resources (stub, replace with real FHIR types if available)
type Patient = any;
type Practitioner = any;

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData } from '../shared/dynamic-forms.interface2';
import { GroupField, IndividualField, CodeField, CodeableConceptField, FormFields } from '../shared/dynamic-forms.interface2';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';

import { MatTabsModule } from '@angular/material/tabs';
import { UploadUiComponent } from '../upload-ui/upload-ui.component';

@Component({
    selector: 'app-practitioner-registration',
    standalone: true,
    imports: [CommonModule,
        UploadUiComponent,
        MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, DynamicFormsV2Component],
    templateUrl: './practitioner-registration.component.html',
    styleUrl: './practitioner-registration.component.scss'
})
export class PractitionerRegistrationComponent {
    selectedTabIndex = 0;
    photoPreview: string | ArrayBuffer | null = null;
    selectedPhotoFile: File | null = null;
    onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.selectedPhotoFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                this.photoPreview = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }

    onSubmitPhoto() {
        if (!this.selectedPhotoFile) {
            this.snackBar.open('Please select a photo to upload.', 'Close', { duration: 2000 });
            return;
        }
        // TODO: Implement actual upload logic here
        this.snackBar.open('Photo submitted (demo only).', 'Close', { duration: 2000 });
    }
    /**
     * Transform form data to FHIR Practitioner resource
     */
    // File upload restrictions
    photoAllowedFiles = /\.(jpg|jpeg|png|gif|pdf|docx|xlsx|txt)$/i;
    photoMaxFileSize = 52428800; // 50MB
    photoMaxFiles = 5;

    // Azure Storage configuration for file uploads (from azure-upload-demo)
    azureStorageAccountName = 'elikita2026kraiyxw7s2ywg'; // Replace with your actual Azure Storage account name
    azureContainerName = 'profile'; // Container name for uploads
    azureSasToken = 'sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiyx&se=2030-11-29T00:08:41Z&st=2025-11-08T15:53:41Z&spr=https&sig=ifQ%2B6AN5bXQ5PMs8lfAMpcsS60KwGjivOyjw4mbo14k%3D'; // Replace with your actual SAS token
    uploadedPhotos: any[] = [];
    onPhotosUploaded(files: any[]) {
        console.log('📸 Photos uploaded event received from upload-ui component');
        console.log('📸 Number of files:', files.length);
        console.log('📸 Files data:', files);

        this.uploadedPhotos = files;

        // Update FHIR Patient with photo attachments
        this.practitioner.photo = files.map(file => ({
            contentType: file.uploadFileType,
            url: file.fileLink,
            title: file.uploadFileName,
            size: file.uploadFileSize,
            creation: new Date().toISOString().split('T')[0]
        }));

        // console.log('✅ FHIR Patient.photo updated successfully!');
        // console.log('🔥 FHIR Patient.photo array:', this.fhirPatient.photo);
        // console.log('🔥 Full FHIR Patient resource:', JSON.stringify(this.fhirPatient, null, 2));

        // Check validation continuously

    }

    transformToFhirPractitioner(formData: any): any {
        const practitioner: any = {
            resourceType: 'Practitioner',
            active: formData.active ?? true,
            name: formData.name ? [this.transformName(formData.name)] : [],
            gender: formData.gender?.toLowerCase() || undefined,
            birthDate: formData.birthDate || undefined,

            telecom: this.mergeTelecom(formData),
            address: formData.address || [],
            qualification: Array.isArray(formData.qualification)
                ? formData.qualification.map((q: any) => ({
                    code: q.code ? { text: q.code } : undefined,
                    issuer: q.issuer ? { display: q.issuer } : undefined
                }))
                : undefined
        };
        return practitioner;
    }

    /**
     * Transform name group to FHIR HumanName
     */
    transformName(nameGroup: any): any {
        return {
            family: nameGroup.family || undefined,
            given: nameGroup.given ? [nameGroup.given] : undefined,
            prefix: nameGroup.title ? [nameGroup.title] : undefined,
            text: [nameGroup.title, nameGroup.given, nameGroup.family, nameGroup.otherNames].filter(Boolean).join(' ')
        };
    }

    /**
     * Merge telecom fields (phone, email, other)
     */
    mergeTelecom(formData: any): any[] | undefined {
        const telecom: any[] = [];
        if (Array.isArray(formData.phone_telecom)) {
            telecom.push(...formData.phone_telecom.map((t: any) => ({ system: 'phone', value: t.value, use: t.use })));
        }
        if (Array.isArray(formData.email_telecom)) {
            telecom.push(...formData.email_telecom.map((t: any) => ({ system: 'email', value: t.value, use: t.use })));
        }
        if (Array.isArray(formData.telecom)) {
            telecom.push(...formData.telecom.map((t: any) => ({ system: t.system, value: t.value, use: t.use })));
        }
        return telecom.length ? telecom : undefined;
    }
    http = inject(HttpClient);
    snackBar = inject(MatSnackBar);

    formMeta: formMetaData = {
        formName: 'Practitioner Registration',
        formDescription: 'Register a new healthcare practitioner',
        submitText: 'Save & Next'
    };
    designatedRegForm?: formMetaData
    designatedFormFields?: FormFields[];
    guardianFormFields?: FormFields[];
    guardianRegForm?: formMetaData;
    formFieldsDataService = inject(FormFieldsSelectDataService)
    ngOnInit() {
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
                            value: false,
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

                    <GroupField>{
                        generalProperties: {
                            fieldApiName: 'qualification',
                            fieldName: 'Qualification',
                            fieldLabel: 'Qualification',
                            fieldType: 'IndividualField',
                            isArray: true,
                            isGroup: true,
                            auth: {
                                read: 'all',
                                write: 'doctor, nurse'
                            }
                        },
                        keys: ['code', 'issuer'],
                        groupFields: {
                            code: <IndividualField>{
                                generalProperties: {
                                    fieldApiName: 'code',
                                    fieldName: 'Qualification/License/Certificate',
                                    fieldLabel: 'Qualification/License/Certificate',
                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            issuer: <IndividualField>{
                                generalProperties: {
                                    fieldApiName: 'issuer',
                                    fieldName: 'Issuer',
                                    fieldLabel: 'Issuer (Issuing Body)',
                                    isArray: false,
                                    isGroup: false
                                }
                            }
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

    /**
     * Validate that Practitioner has a usable name
     * Returns true if at least one of family, any given, or text is non-empty
     */
    private hasValidName(pract: any): boolean {
        const names = pract?.name;
        if (!Array.isArray(names) || names.length === 0) return false;
        return names.some((n: any) => {
            const family = (n?.family ?? '').toString().trim();
            const givenArr = Array.isArray(n?.given)
                ? n.given.map((g: any) => (g ?? '').toString().trim()).filter(Boolean)
                : [];
            const text = (n?.text ?? '').toString().trim();
            return Boolean(family) || givenArr.length > 0 || Boolean(text);
        });
    }


    onSubmit(values: any) {
        // Map form values to FHIR Practitioner resource
        this.practitioner = this.transformToFhirPractitioner(values);

        // Validate: ensure Practitioner has a name before proceeding
        if (!this.hasValidName(this.practitioner)) {
            this.errorService.openandCloseError('Missing name: please enter first and/or last name.');
            return;
        }

        // Move to the next Angular Material tab
        this.selectedTabIndex = 1;
    }
    onFinalSubmit() {
        // Defensive check before POST
        if (!this.hasValidName(this.practitioner)) {
            this.errorService.openandCloseError('Cannot submit: practitioner name is required.');
            return;
        }
        this.http.post('https://elikita-server.daalitech.com/Practitioner', this.practitioner).subscribe({
            next: () => {
                this.snackBar.openFromComponent(SuccessMessageComponent, {
                    data: { message: 'Patient updated successfully.', action: 'Close' },
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                });
                this.snackBar.open('Practitioner registered successfully!', 'Close', { duration: 3000 });
            },
            error: () => {
                this.errorService.openandCloseError("Failed to register practitioner.")
                this.snackBar.open('Failed to register practitioner.', 'Close', { duration: 3000 })
            }
        });
    }

    practitioner: any = {};
    parseCodeableConcept(val: any): any {
        // Stub: convert value to FHIR CodeableConcept
        if (!val) return undefined;
        if (typeof val === 'string') return { text: val };
        return val;
    }

    transformGuardianToFhirContact(guardianData: any): any {
        // Stub: convert guardian data to FHIR contact
        return Array.isArray(guardianData) ? guardianData : [guardianData];
    }

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
}
