import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CodeableConcept, MedicationRequest, Reference } from 'fhir/r4';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData } from '../shared/dynamic-forms.interface';
import {
    CodeableConceptField, GroupField, IndividualField,
    IndividualReferenceField, ReferenceFieldArray, SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { AuthService } from '../shared/auth/auth.service';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | GroupField | IndividualReferenceField;

@Injectable({ providedIn: 'root' })
export class MedicineAdministrationDialogService {
    private dialog = inject(MatDialog);
    private formFieldsDataService = inject(FormFieldsSelectDataService);
    private errorService = inject(ErrorService);
    private auth = inject(AuthService);

    private loadField(fieldName: string, ...path: string[]) {
        return this.formFieldsDataService.getFormFieldSelectData(...path).pipe(
            tap(() => console.log(`[medadmin] ${fieldName} loaded`)),
            catchError((error) => {
                console.error(`[medadmin] ${fieldName} failed`, error);
                return of(null);
            })
        );
    }

    openAdministrationDialog(medicationRequest?: MedicationRequest): void {
        const now = new Date().toISOString();
        const performerReference = this.getCurrentUserPractitionerReference();
        const subjectReference = medicationRequest?.subject as Reference | null;
        const medicationCodeableConcept = medicationRequest?.medicationCodeableConcept ?? null;
        forkJoin({
            status: this.loadField('status', 'medication_administration', 'status'),
            subject: this.loadField('subject', 'medication_administration', 'subject'),
            performer: this.loadField('performer', 'medication_administration', 'performer'),
            medication: this.loadField('medication', 'medication_administration', 'medication')
        }).subscribe({
            next: (g: any) => {
                this.dialog.open(DynamicFormsV2Component, {
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    data: {
                        formMetaData: <formMetaData>{
                            formName: 'Medication Administration',
                            formDescription: 'Use this form to record a medicine administration.',
                            submitText: 'Confirm Medicine Administration'
                        },
                        formFields: <FormFields[]>[
                            {
                                generalProperties: {
                                    fieldApiName: 'intendOccurrence',
                                    fieldName: 'When this administration occurred',
                                    fieldLabel: 'When this administration occurred',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    value: now,
                                    inputType: 'datetime-local',
                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'recorded',
                                    fieldName: 'Recorded At',
                                    fieldLabel: 'Recorded At',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    value: now,
                                    inputType: 'datetime-local',
                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'status',
                                    fieldName: 'Status',
                                    fieldLabel: 'Status',
                                    fieldType: 'SingleCodeField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    value: 'completed',
                                    isArray: false,
                                    isGroup: false,
                                    isHidden: true
                                },
                                data: ['completed']
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'medicationCodeableConcept',
                                    fieldName: 'Medication Codeable Concept',
                                    fieldLabel: 'Medication Codeable Concept',
                                    fieldType: 'CodeableConceptField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: false,
                                    isGroup: false,
                                    isHidden: !!medicationCodeableConcept,
                                    value: medicationCodeableConcept ?? undefined
                                },
                                data: g.medication
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'subject',
                                    fieldName: 'Subject',
                                    fieldLabel: 'Subject',
                                    fieldType: 'CodeableConceptField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: true,
                                    isGroup: false,
                                    isHidden: !!subjectReference,
                                    value: subjectReference ?? undefined
                                },
                                data: g.subject
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'actor',
                                    fieldName: 'Performer',
                                    fieldLabel: 'Performer',
                                    fieldType: 'IndividualReferenceField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    value: performerReference ?? undefined,
                                    isArray: true,
                                    isGroup: false
                                },
                                data: g.performer
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'note',
                                    fieldName: 'Note About the Administration',
                                    fieldLabel: 'Note About the Administration',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    inputType: 'textarea',
                                    isArray: false,
                                    isGroup: false
                                }
                            }
                        ]
                    }
                });
            },
            error: (err) => {
                this.errorService.openandCloseError('Error ocurred while preparing medication administration form');
                console.log(err);
            }
        });
    }

    private getCurrentUserPractitionerReference(): Reference | null {
        const currentUser = this.auth.user.getValue();
        if (!currentUser) {
            return null;
        }
        const practitionerId = currentUser['id'] ?? currentUser['userId'];
        const displayName = currentUser['display'] ?? currentUser['name'] ?? '';
        return practitionerId ? { reference: `Practitioner/${practitionerId}`, display: displayName } : null;
    }
}
