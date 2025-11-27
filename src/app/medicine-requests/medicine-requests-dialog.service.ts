import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, tap, switchMap, withLatestFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CodeableConcept, Medication, Bundle, BundleEntry, FhirResource } from 'fhir/r4';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { } from '../shared/dynamic-forms.interface';
import {
    formMetaData,
    CodeableConceptField, CodeField, GroupField, IndividualField,
    IndividualReferenceField, ReferenceFieldArray, SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { AuthService } from '../shared/auth/auth.service';
import { backendEndPointToken } from '../app.config';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { MedicationDispense, Reference, MedicationRequest } from 'fhir/r4';
import { HttpClient } from '@angular/common/http';
import { AddMedicationDispenseComponent } from '../medication-dispense/add-medication-dispense/add-medication-dispense.component';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Injectable({ providedIn: 'root' })
export class MedicineRequestsDialogService {
    private dialog = inject(MatDialog);
    private formFieldsDataService = inject(FormFieldsSelectDataService);
    private errorService = inject(ErrorService);
    private auth = inject(AuthService);
    private backendEndPoint = inject(backendEndPointToken);
    private fhirResourceService = inject(FhirResourceService);
    private snackBar = inject(MatSnackBar);

    private loadMedicationDispenseField(fieldName: string, ...path: string[]) {
        return this.formFieldsDataService.getFormFieldSelectData(...path).pipe(
            tap(() => console.log(`[meddispense] ${fieldName} loaded`)),
            catchError((error) => {
                console.error(`[meddispense] ${fieldName} failed`, error);
                return of(null);
            })
        );
    }

    openDispenseDialog(
        medicationRequestId: string | null = null,
        medicationReference: Reference | null = null,
        medicationCodeableConcept: CodeableConcept | null = null,
        patientReference: Reference | null = null,
        row: MedicationRequest | null = null,
        groupId: string | null = null
    ): void {
        const now = new Date().toISOString();
        const medicationLabel =
            medicationCodeableConcept?.text
            || medicationCodeableConcept?.coding?.[0]?.display
            || medicationCodeableConcept?.coding?.[0]?.code
            || medicationReference?.display
            || medicationReference?.reference
            || 'Medication';
        const patientLabel =
            patientReference?.reference?.split('/').pop()
            || patientReference?.display
            || 'Patient';
        const performerReference = this.getCurrentUserPractitionerReference();

        const formName = medicationLabel && patientLabel
            ? `Medication Dispense form of ${medicationLabel} for Patient ${patientLabel}`
            : 'Medication Dispense form';

        forkJoin({
            status: this.loadMedicationDispenseField('status', 'medication_dispense', 'status'),
            subject: this.loadMedicationDispenseField('subject', 'medication_dispense', 'subject'),
            receiver: this.loadMedicationDispenseField('receiver', 'medication_dispense', 'receiver').pipe(
                withLatestFrom(this.loadMedicationDispenseField('performer', 'medication_dispense', 'performer')),
                map(([incomingArray, extraResponse]) => ([
                    ...incomingArray,
                    ...extraResponse
                ])
                )
            ),
            medication: this.loadMedicationDispenseField('medication', 'medication_dispense', 'medication'),
            category: this.loadMedicationDispenseField('category', 'medication_dispense', 'category'),
            medicationReference: this.loadMedicationDispenseField('medicationReference', 'medication_dispense', 'medicationReference'),
            performer: this.loadMedicationDispenseField('performer', 'medication_dispense', 'performer'),
            authorizingPrescription: this.loadMedicationDispenseField('authorizingPrescription', 'medication_dispense', 'authorizingPrescription'),
            substitutionReason: this.loadMedicationDispenseField('substitutionReason', 'medication_dispense', 'substitutionReason'),
            substitutionType: this.loadMedicationDispenseField('substitutionType', 'medication_dispense', 'substitutionType')
        }).subscribe({
            next: (g: any) => {
                const dialogRef = this.dialog.open(AddMedicationDispenseComponent, {
                    maxWidth: '680px',
                    maxHeight: '90vh',
                    panelClass: "p-20",
                    data: {
                        medicationReference: <Reference | null>medicationReference,
                        medicationCodeableConcept: <CodeableConcept | null>medicationCodeableConcept,
                        subject: <Reference | null>patientReference,
                        row: <MedicationRequest | null>row,
                        medicationRequestId: <string | null>medicationRequestId,
                        groupId: <string | null>groupId,
                        formMetaData: <formMetaData>{
                            formName,
                            formDescription: 'Use this form to record a medication dispense.',
                            submitText: 'Confirm Dispense',
                            closeDialogOnSubmit: true

                        },
                        formFields: <FormFields[]>[
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
                                    fieldApiName: 'medicationReference',
                                    fieldName: 'Medication In Stock Reference',
                                    fieldLabel: 'Medication In Stock Reference',
                                    fieldType: 'IndividualReferenceField',
                                    fieldHint: 'Choose from medication in stock',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: false,
                                    isGroup: false,
                                    // isHidden: !!(medicationReference || medicationCodeableConcept) || !g.medicationReference
                                    //     || g.medicationReference?.length === 0
                                    // ,
                                    value: medicationReference ?? undefined
                                },
                                data: medicationReference ? g.medicationReference.filter((e: any) => {
                                    if (typeof (e) === 'object') {
                                        return !e.reference.includes(medicationReference.reference!)
                                    } else {
                                        return !e.includes(medicationReference.reference!)
                                    }
                                }) : g.medicationReference
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'medicationCodeableConcept',
                                    fieldName: 'Medication Name',
                                    fieldLabel: 'Medication Name',
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
                                    fieldApiName: 'category',
                                    fieldName: 'Dispense Category',
                                    fieldLabel: 'Dispense Category',
                                    fieldType: 'CodeableConceptField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: false,
                                    isGroup: false,
                                    allowedOthers: true
                                },
                                data: g.category
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'quantity',
                                    fieldName: 'Quantity Dispensed',
                                    fieldLabel: 'Quantity Dispensed',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    inputType: 'number',

                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            // {
                            //     generalProperties: {
                            //         fieldApiName: 'recordedDate',
                            //         fieldName: 'Recorded Date',
                            //         fieldLabel: 'Recorded Date',
                            //         auth: { read: 'all', write: 'doctor, nurse' },
                            //         inputType: 'datetime-local',
                            //         value: now,
                            //         isArray: false,
                            //         isGroup: false,
                            //         isHidden: true
                            //     }
                            // },
                            {
                                generalProperties: {
                                    fieldApiName: 'whenHandedOver',
                                    fieldName: 'When Handed Over',
                                    fieldLabel: 'When Handed Over',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    inputType: 'datetime-local',
                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'subject',
                                    fieldName: 'Subject',
                                    fieldLabel: 'Who is this Medication For',
                                    fieldType: 'CodeableConceptField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: false,
                                    isGroup: false,

                                    isHidden: !!patientReference,
                                    value: patientReference ?? undefined
                                },
                                data: g.subject
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'performerActor',
                                    fieldName: 'Performer Actor',
                                    fieldLabel: 'Performer Actor',
                                    fieldType: 'IndividualReferenceField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    value: performerReference ?? undefined,
                                    isArray: false,
                                    isGroup: false,
                                    isHidden: performerReference
                                },
                                data: g.performer
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'authorizingPrescription',
                                    fieldName: 'Authorizing Prescription',
                                    fieldLabel: 'Authorizing Prescription',
                                    fieldType: 'IndividualReferenceField',
                                    fieldHint: 'The MedicationRequest that authorized this dispense.',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: true,
                                    isGroup: false,
                                    isHidden: !!medicationRequestId,
                                    value: medicationRequestId ? { reference: `MedicationRequest/${medicationRequestId}` } : undefined
                                },
                                data: g.authorizingPrescription
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'receiver',
                                    fieldName: 'Receiver',
                                    fieldLabel: 'Receiver',
                                    fieldType: 'IndividualReferenceField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: true,
                                    isGroup: false,
                                    value: g?.subject?.find((e: Reference) => e.reference === patientReference),
                                },

                                data: g.receiver
                            },
                            {
                                generalProperties: {
                                    fieldApiName: 'dosageInstruction.text',
                                    fieldName: 'Dosage Instructions',
                                    fieldLabel: 'Dosage Instructions',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    inputType: 'textarea',
                                    isArray: false,
                                    isGroup: false
                                }
                            },
                            <GroupField>{
                                generalProperties: {
                                    fieldApiName: 'substitution',
                                    fieldName: 'Substitution Info',
                                    fieldLabel: 'Substitution Info',
                                    fieldType: 'CodeField',
                                    auth: { read: 'all', write: 'doctor, nurse' },
                                    isArray: false,
                                    isGroup: true
                                },
                                groupFields: {
                                    wasSubstituted: <SingleCodeField>{
                                        generalProperties: {
                                            fieldApiName: 'substitution_wasSubstituted',
                                            fieldName: 'Was Substituted',
                                            fieldLabel: 'Was Substituted',
                                            fieldType: 'SingleCodeField',
                                            inputType: 'toggle',
                                            isHidden: true,
                                            value: true,

                                            auth: { read: 'all', write: 'doctor, nurse' },
                                            isArray: false,
                                            isGroup: false
                                        },
                                        data: ['Yes', 'No']
                                    },
                                    substitutionReason: <CodeableConceptField>{
                                        generalProperties: {
                                            fieldApiName: 'substitution_reason',
                                            fieldName: 'Substitution Reason',
                                            fieldLabel: 'Substitution Reason',
                                            fieldType: 'CodeableConceptField',
                                            allowedOthers: true,
                                            auth: { read: 'all', write: 'doctor, nurse' },
                                            isArray: false,
                                            isGroup: false
                                        },
                                        data: g.substitutionReason
                                    },
                                    substitutionType: <CodeableConceptField>{
                                        generalProperties: {
                                            fieldApiName: 'substitution_type',
                                            fieldName: 'Substitution Type',
                                            fieldLabel: 'Substitution Type',
                                            fieldType: 'CodeableConceptField',
                                            allowedOthers: true,
                                            auth: { read: 'all', write: 'doctor, nurse' },
                                            isArray: false,
                                            isGroup: false
                                        },
                                        data: g.substitutionType
                                    }
                                },
                                keys: ['wasSubstituted', 'substitutionReason', 'substitutionType']
                            }
                        ]
                    }
                });

                dialogRef.afterClosed().subscribe((result) => {
                    console.log('[meddispense] dialog closed with', result);
                    if (!result || !result.values || (Array.isArray(result.values) && result.values.length === 0)) {
                        this.errorService.openandCloseError('No Medication Dispense was created as the form was closed without submission.');
                        return;
                    }
                    //check if there is a status, subject, either of medicationCodeableConcept or medicationReference
                    if (!result.values.subject || (Array.isArray(result.values.subject) && result.values.subject.length === 0)) {
                        this.errorService.openandCloseError('No Subject was provided. Medication Dispense requires a subject.');
                        return;
                    }
                    if (!result.values.status || (Array.isArray(result.values.status) && result.values.status.length === 0)) {
                        this.errorService.openandCloseError('No Status was provided. Medication Dispense requires a status.');
                        return;
                    }
                    if ((!result.values.medicationCodeableConcept || (Array.isArray(result.values.medicationCodeableConcept) && result.values.medicationCodeableConcept.length === 0)) &&
                        (!result.values.medicationReference || (Array.isArray(result.values.medicationReference) && result.values.medicationReference.length === 0))) {
                        this.errorService.openandCloseError('No Medication was provided. Medication Dispense requires either medicationCodeableConcept or medicationReference.');
                        return;
                    }

                    const payloads = (Array.isArray(result.values) ? result.values : [result.values])
                        .map((entry: any) => this.prepareDispensePayload(entry));
                    console.log('[meddispense] prepared payloads count', payloads.length);
                    forkJoin(payloads).pipe(
                        map((items: any) => items.flatMap((item: { medicationUpdate: { resource: FhirResource | undefined; id: any; }; dispenseResource: FhirResource | undefined; }) => {
                            const entries: BundleEntry[] = [];
                            if (item.medicationUpdate) {
                                entries.push({
                                    resource: {
                                        ...item.medicationUpdate.resource,
                                        resourceType: 'Medication',
                                        id: item.medicationUpdate.id
                                    } as Medication,
                                    request: { method: 'PUT', url: `Medication/${item.medicationUpdate.id}` }
                                });
                            }
                            if (item.dispenseResource) {
                                entries.push({
                                    resource: {
                                        ...item.dispenseResource,
                                        resourceType: 'MedicationDispense'
                                    } as MedicationDispense,
                                    request: { method: 'POST', url: 'MedicationDispense' }
                                });
                            }
                            return entries;
                        }))
                    ).subscribe({
                        next: (entries) => {
                            if (!entries.length) {
                                this.errorService.openandCloseError('No resources were prepared for submission.');
                                return;
                            }
                            const bundle: Bundle = { resourceType: 'Bundle', type: 'transaction', entry: entries };
                            this.fhirResourceService.postBundle(bundle).subscribe({
                                next: () => {
                                    this.snackBar.openFromComponent(SuccessMessageComponent, {
                                        data: { message: 'Medication dispense saved successfully.' },
                                        duration: 3000
                                    });
                                },
                                error: (err) => {
                                    console.error('Failed to submit dispense bundle:', err);
                                    this.errorService.openandCloseError('Failed to submit medication dispense. Please try again.');
                                }
                            });
                        },
                        error: (err) => {
                            console.error('Error preparing dispense payloads:', err);
                            this.errorService.openandCloseError('Failed to prepare medication dispense. Please try again.');
                        }
                    });
                });
            },
            error: (err) => {
                this.errorService.openandCloseError('Error ocurred while preparing fields dropdowns for the form');
                console.log(err);
            }
        });
    }

    private getCurrentUserPractitionerReference(): string | null {
        const currentUser = this.auth.user.getValue();
        if (!currentUser) {
            return null;
        }
        const practitionerId = currentUser['userId'] ?? currentUser['id'];
        return practitionerId ? `Practitioner/${practitionerId}` : null;
    }
    http = inject(HttpClient);
    private prepareDispensePayload(entry: any) {
        const quantity = this.parseQuantity(entry?.quantity);
        const medRef = this.coerceReference(entry?.medicationReference);
        console.log('[meddispense] prepareDispensePayload', { entry, quantity, medRef });
        if (medRef?.reference && quantity > 0) {
            const medId = this.extractResourceId(medRef.reference);
            if (!medId) {
                console.log('[meddispense] medication reference missing id, skipping fetch');
                return of({ dispenseResource: this.buildMedicationDispenseResource(entry, quantity, medRef) });
            }
            console.log('[meddispense] fetching medication for update', medId);
            return this.http.get<Medication>(`${this.backendEndPoint}/Medication/${medId}`).pipe(
                map(medication => {
                    const inventory = this.findInventoryExtension(medication);
                    const unit = this.getInventoryUnit(inventory);
                    const medicationUpdate = this.buildMedicationUpdatePayload(medication, quantity);
                    const dispenseResource = this.buildMedicationDispenseResource(entry, quantity, medRef, unit);
                    console.log('[meddispense] medication fetched', medId, { inventory, updated: medicationUpdate, dispense: !!dispenseResource });
                    return {
                        dispenseResource,
                        medicationUpdate: medicationUpdate ? { id: medId, resource: medicationUpdate } : undefined
                    };
                })
            );
        }
        console.log('[meddispense] no medication reference or zero quantity, only building dispense');
        return of({
            dispenseResource: this.buildMedicationDispenseResource(entry, quantity, medRef)
        });
    }

    private buildMedicationDispenseResource(entry: any, quantity: number, medicationReference?: { reference: string; display?: string }, unit?: string) {
        const resource: any = {
            status: 'completed',
            whenHandedOver: entry.whenHandedOver ?? new Date().toISOString(),
            quantity: {
                value: Number.isFinite(quantity) ? quantity : 0,
                ...(unit ? { unit, system: 'http://unitsofmeasure.org' } : {})
            }
        };
        if (medicationReference?.reference) {
            resource.medicationReference = medicationReference;
        } else if (entry?.medicationCodeableConcept) {
            resource.medicationCodeableConcept = entry.medicationCodeableConcept;
        }
        const subjectRef = this.coerceReference(entry?.subject);
        if (subjectRef?.reference) {
            resource.subject = subjectRef;
        }
        const performerRef = this.coerceReference(entry?.performerActor);
        if (performerRef?.reference) {
            resource.performer = [{ actor: performerRef }];
        }
        if (entry?.status) {
            resource.status = (entry.status || '').toString().toLowerCase();
        }
        //if no receiever
        // const receiverRef = this.coerceReference(entry?.receiver);
        if (!resource.receiver) {
            resource.receiver = [subjectRef]
        }
        return resource;
    }

    private buildMedicationUpdatePayload(medication: Medication, quantity: number): Medication | undefined {
        const inventory = this.findInventoryExtension(medication);
        const totalRemainingExt = this.findInventoryField(inventory, 'totalRemaining');
        if (!totalRemainingExt) return undefined;
        const cloned = JSON.parse(JSON.stringify(medication));
        const clonedInventory = this.findInventoryExtension(cloned);
        const clonedField = this.findInventoryField(clonedInventory, 'totalRemaining');
        if (!clonedField) return undefined;
        const current = Number(totalRemainingExt.valueQuantity?.value ?? totalRemainingExt.valueInteger ?? totalRemainingExt.valueString ?? 0);
        const updatedValue = Math.max(0, current - quantity);
        if (clonedField.valueQuantity) {
            clonedField.valueQuantity.value = updatedValue;
        } else {
            clonedField.valueInteger = updatedValue;
        }
        return cloned;
    }

    private findInventoryExtension(medication: Medication): any | undefined {
        return medication?.extension?.find((ext: any) =>
            typeof ext.url === 'string' && ext.url.includes('medication-inventory-details')
        );
    }

    private findInventoryField(inventory: any, key: string): any | undefined {
        return inventory?.extension?.find((ext: any) =>
            ext?.url === key || (typeof ext?.url === 'string' && ext.url.endsWith(`/${key}`))
        );
    }

    private getInventoryUnit(inventory: any): string | undefined {
        const unitExt = this.findInventoryField(inventory, 'dispensableUnits');
        if (!unitExt) return undefined;
        return unitExt.valueString || unitExt.valueCodeableConcept?.text || unitExt.valueCodeableConcept?.coding?.[0]?.display;
    }

    private coerceReference(input: any): { reference: string; display?: string } | undefined {
        if (!input) return undefined;
        if (typeof input === 'string') {
            const parts = input.split('$#$');
            return { reference: `${parts[0]}`.trim(), display: parts[1]?.trim() };
        }
        if (typeof input === 'object' && input.reference) {
            return { reference: input.reference, display: input.display };
        }
        return undefined;
    }

    private parseQuantity(value: any): number {
        if (value == null) return 0;
        const numeric = typeof value === 'object' && 'value' in value ? Number(value.value) : Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    }

    private extractResourceId(reference?: string): string | undefined {
        if (!reference) return undefined;
        const parts = reference.split('/');
        return parts.length ? parts[parts.length - 1] : undefined;
    }
}
