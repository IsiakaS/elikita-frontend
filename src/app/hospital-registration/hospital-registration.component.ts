import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData } from '../shared/dynamic-forms.interface2';
import { CommonModule } from '@angular/common';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { forkJoin } from 'rxjs';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorService } from '../shared/error.service';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { LoaderComponent } from '../loader/loader.component';
import { Organization } from 'fhir/r4';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
    selector: 'app-hospital-registration',
    standalone: true,
    imports: [CommonModule, DynamicFormsV2Component, HttpClientModule, MatSnackBarModule, MatDialogModule],
    templateUrl: './hospital-registration.component.html',
    styleUrl: './hospital-registration.component.scss'
})
export class HospitalRegistrationComponent implements OnInit {

    hospitalFormMetaData!: formMetaData;
    hospitalFormFields!: FormFields[];
    formFieldsDataService = inject(FormFieldsSelectDataService);
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);
    private errorService = inject(ErrorService);
    private dialog = inject(MatDialog);
    /** Cached last transformed FHIR Organization for debug / preview */
    fhirOrganization?: Organization;

    ngOnInit() {
        this.initializeForm();
    }

    initializeForm() {
        this.hospitalFormMetaData = {
            formName: "Hospital Registration",
            formDescription: "Register Your Healthcare Organization",
            submitText: "Register Organization",
        };

        // Load dropdown/select options for telecom fields (contact point system and use)
        forkJoin({
            contactPointUse: this.formFieldsDataService.getFormFieldSelectData('patient', 'contactPointUse'),
            contactPointSystem: this.formFieldsDataService.getFormFieldSelectData('patient', 'contactPointSystem')
        }).subscribe((g: any) => {
            this.hospitalFormFields = this.getHospitalFormFields(g);
        });
    }

    getHospitalFormFields(g: { contactPointUse: any[]; contactPointSystem: any[]; }): FormFields[] {
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
                            data: g.contactPointSystem,
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
                            value: "work",
                            data: g.contactPointUse,
                            isHidden: true,
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
                            data: g.contactPointSystem,
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
                            value: 'work',
                            data: g.contactPointUse,
                            isHidden: true,
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
                            data: g.contactPointSystem,
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
                            data: g.contactPointUse,
                            value: 'work',
                            isArray: false,
                            isGroup: false
                        },
                        data: g.contactPointUse
                    },
                },
            },
            // Organization address (similar pattern to Patient address group)
            <GroupField>{
                generalProperties: {
                    fieldApiName: 'address',
                    fieldName: 'Address',
                    fieldLabel: 'Address',
                    fieldType: 'IndividualField',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    isArray: true,
                    isGroup: true
                },
                // Using same keys order as patient registration for consistency
                keys: ['line', 'city', 'state', 'country', 'postalCode'],
                groupFields: {
                    line: <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'line',
                            fieldName: 'Address Line',
                            fieldLabel: 'Address Line',
                            fieldType: 'IndividualField',
                            auth: { read: 'all', write: 'doctor, nurse' },
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
                            auth: { read: 'all', write: 'doctor, nurse' },
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
                            auth: { read: 'all', write: 'doctor, nurse' },
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
                            auth: { read: 'all', write: 'doctor, nurse' },
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
                            auth: { read: 'all', write: 'doctor, nurse' },
                            isArray: false,
                            isGroup: false
                        }
                    }
                }
            },
            <GroupField>(<unknown>{
                generalProperties: {
                    fieldApiName: 'qualification',
                    fieldName: "Qualifications",
                    fieldLabel: "Organization's Qualifications",
                    groupFieldsHint: 'Provide each qualification: description (first box), issuing body, and an optional website link.',
                    isArray: true,
                    isGroup: true,
                    auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                    }
                },
                keys: ['code', 'issuer_name', 'issuer_website_link'],
                groupFields: {
                    'code': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'qualification',
                            fieldName: 'Qualification',
                            fieldLabel: 'Qualification',
                            fieldPlaceholder: 'Describe qualification, accreditation or license',
                            inputType: 'textarea',
                            isArray: false,
                            isGroup: false,
                        }
                    },
                    'issuer_name': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'issuer_name',
                            fieldName: 'Issuer',
                            fieldLabel: 'Issuer',
                            fieldPlaceholder: 'Issuing body',
                            isArray: false,
                            isGroup: false,
                        }
                    },
                    'issuer_website_link': <IndividualField>{
                        generalProperties: {
                            fieldApiName: 'issuer_website_link',
                            fieldName: 'Website',
                            fieldLabel: 'Website',
                            fieldPlaceholder: 'https://',
                            isArray: false,
                            isGroup: false,
                        }
                    },
                }
            })
        ];
    }

    onFormSubmit(formData: any) {
        // 1. Transform raw form data to FHIR R4 Organization resource
        const fhirOrg = this.transformToFhirOrganization(formData);
        this.fhirOrganization = fhirOrg; // cache for debug/preview if needed

        // 2. Validate required & recommended data presence
        const validation = this.validateFhirOrganization(fhirOrg);
        if (!validation.valid) {
            const message = `Organization registration blocked: ${validation.errors.join('; ')}`;
            this.errorService.openandCloseError(message); // Bold transient error UI (existing style)
            this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['snackbar-error'] });
            return;
        }

        // 3. Prune empty arrays/objects to keep payload lean
        const pruned = this.pruneEmpty(structuredClone ? structuredClone(fhirOrg) : JSON.parse(JSON.stringify(fhirOrg)));

        // 4. Submit to Elikita FHIR server
        const url = 'https://elikita-server.daalitech.com/Organization';
        // Open loader dialog while awaiting POST
        const loaderRef = this.dialog.open(LoaderComponent, { data: { message: 'Registering organization...' }, disableClose: true });

        this.http.post(url, pruned, {
            headers: { 'Content-Type': 'application/fhir+json', 'Accept': 'application/fhir+json' }
        }).subscribe({
            next: (resp) => {
                loaderRef.close();
                // Rich success component in snackbar
                this.snackBar.openFromComponent(SuccessMessageComponent, {
                    data: { message: 'Organization Registered Successfully!' },
                    duration: 3500,
                    horizontalPosition: 'center',
                    verticalPosition: 'top'
                });
            },
            error: (err) => {
                loaderRef.close();
                const em = 'Failed to register organization. Please try again.';
                console.error('Organization submission error:', err);
                this.errorService.openandCloseError(em);
                this.snackBar.open(em, 'Close', { duration: 5000, panelClass: ['snackbar-error'] });
            }
        });
    }

    /**
     * Transform raw hospital registration form data to a FHIR R4 Organization resource.
     * Form keys consumed: name, type, description, phone_telecom{value,system,use}, email_telecom{value,system,use},
     * telecom[] (array of {value, system, use}), qualification[] (array of {qualification, issuer_name, issuer_website_link}).
     */
    private transformToFhirOrganization(formData: any): Organization {
        const telecom: any[] = [];
        // Build address array (FHIR Organization.address is an Address[])
        const address: any[] = [];

        // Helper to push telecom entries if they have a value
        const pushTelecom = (t: any) => {
            if (t && t.value) {
                telecom.push({ system: t.system, value: t.value, use: t.use });
            }
        };

        pushTelecom(formData.phone_telecom);
        pushTelecom(formData.email_telecom);

        if (Array.isArray(formData.telecom)) {
            formData.telecom.forEach((t: any) => pushTelecom(t));
        }

        // Map type -> CodeableConcept (simple text only for now). If more controlled vocabulary desired later, extend with coding[]
        const orgType = formData.type ? [{ text: String(formData.type).trim() }] : undefined;

        // Qualifications aren't part of standard Organization in R4 (they exist for Practitioner). Represent as extensions.
        const extensions: any[] = [];
        if (Array.isArray(formData.qualification)) {
            formData.qualification.forEach((q: any) => {
                const hasAny = q?.qualification || q?.issuer_name || q?.issuer_website_link;
                if (!hasAny) return;
                const ext: any = {
                    url: 'http://elikita.org/fhir/StructureDefinition/organization-qualification',
                    extension: [] as any[]
                };
                if (q.qualification) ext.extension.push({ url: 'description', valueString: String(q.qualification).trim() });
                if (q.issuer_name) ext.extension.push({ url: 'issuer', valueString: String(q.issuer_name).trim() });
                if (q.issuer_website_link) ext.extension.push({ url: 'website', valueUri: String(q.issuer_website_link).trim() });
                if (ext.extension.length > 0) extensions.push(ext);
            });
        }

        const organization: Organization = {
            resourceType: 'Organization',
            name: formData.name ? String(formData.name).trim() : undefined,
            type: orgType,
            telecom: telecom.length > 0 ? telecom : undefined,
            address: Array.isArray(formData.address) && formData.address.length > 0 ? formData.address.map((a: any) => ({
                line: a.line ? [String(a.line).trim()] : undefined,
                city: a.city ? String(a.city).trim() : undefined,
                state: a.state ? String(a.state).trim() : undefined,
                country: a.country ? String(a.country).trim() : undefined,
                postalCode: a.postalCode ? String(a.postalCode).trim() : undefined,
                text: [a.line, a.city, a.state, a.country, a.postalCode].filter(Boolean).join(', ') || undefined
            })) : undefined,
            // Use text description as an extension (since Organization.description is not a direct property; use an extension pattern)
            extension: []
        } as Organization;

        if (formData.description) {
            organization.extension = organization.extension || [];
            organization.extension.push({
                url: 'http://elikita.org/fhir/StructureDefinition/organization-description',
                valueString: String(formData.description).trim()
            });
        }

        if (extensions.length > 0) {
            organization.extension = organization.extension || [];
            organization.extension.push(...extensions);
        }

        // Clean empty extension array if nothing was added
        if (organization.extension && organization.extension.length === 0) {
            delete (organization as any).extension;
        }

        return organization;
    }

    /** Validate required & recommended Organization data */
    private validateFhirOrganization(org: Organization): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        // Required (business rules): name, at least one telecom
        if (!org.name) errors.push('Organization name is required');
        if (!org.telecom || org.telecom.length === 0) errors.push('At least one contact (telecom) is required');
        // Recommended: type (category) & description (extension description)
        if (!org.type || org.type.length === 0) errors.push('Organization type (category) is recommended');
        const hasDescription = (org.extension || []).some(e => e.url === 'http://elikita.org/fhir/StructureDefinition/organization-description');
        if (!hasDescription) errors.push('Organization description is recommended');
        return { valid: errors.length === 0, errors };
    }

    /** Recursively prune empty arrays/objects & undefined values */
    private pruneEmpty<T>(input: T): T {
        const isObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);
        const prune = (val: any): any => {
            if (Array.isArray(val)) {
                const prunedArr = val.map(prune).filter(v => v !== undefined && !(Array.isArray(v) && v.length === 0) && !(isObject(v) && Object.keys(v).length === 0));
                return prunedArr.length > 0 ? prunedArr : undefined;
            } else if (isObject(val)) {
                const entries = Object.entries(val).map(([k, v]) => [k, prune(v)] as [string, any]).filter(([_, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0) && !(isObject(v) && Object.keys(v).length === 0));
                if (entries.length === 0) return undefined;
                return Object.fromEntries(entries);
            } else {
                return val === undefined || val === null || val === '' ? undefined : val;
            }
        };
        return prune(input);
    }
}
