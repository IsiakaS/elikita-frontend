import { Component, inject, OnInit, Inject, Optional, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, of } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormFields, formMetaData, IndividualField } from '../../shared/dynamic-forms.interface2';
import { UtilityService } from '../../shared/utility.service';
import { FhirResourceService } from '../../shared/fhir-resource.service';
import { SuccessMessageComponent } from '../../shared/success-message/success-message.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { backendEndPointToken } from '../../app.config';
import { CodeableConcept, Medication, Reference } from 'fhir/r4';
import { CodeableConcept2Pipe } from "../../shared/codeable-concept2.pipe";
import { NaPipe } from "../../shared/na.pipe";
import { ReferenceDisplayDirective } from '../../shared/reference-display.directive';
import { Form, FormArray, FormBuilder, AbstractControl, FormGroup } from '@angular/forms';
import { MedicationDispenseFieldFilterService } from '../medication-dispense-field-filter.service';
import { FhirResourceTransformService } from '../../shared/fhir-resource-transform.service';

@Component({
    selector: 'app-add-medication-dispense',
    standalone: true,
    imports: [CommonModule, ReferenceDisplayDirective,
        MatCardModule, MatButtonModule, MatIconModule, DynamicFormsV2Component, CodeableConcept2Pipe, NaPipe],
    templateUrl: './add-medication-dispense.component.html',
    styleUrls: ['./add-medication-dispense.component.scss']
})
export class AddMedicationDispenseComponent implements OnInit {
    dialogRef = inject(MatDialogRef<AddMedicationDispenseComponent>);
    formFieldService = inject(FormFieldsSelectDataService);
    errorService = inject(ErrorService);
    http = inject(HttpClient);
    utilityService = inject(UtilityService);
    fhirResourceService = inject(FhirResourceService);
    snackBar = inject(MatSnackBar);
    backendEndPoint = inject(backendEndPointToken);
    formFields: (FormFields[])[] = [];
    fb = inject(FormBuilder);
    substitutionForm = this.fb.group({
        substitutionArray: this.fb.array([])
    });
    substitutionFormArray = this.substitutionForm.get('substitutionArray') as FormArray;

    addToSubstitutionArray(
        values?: { authorizingPrescription?: string; wasSubstituted?: string; reason?: string; type?: string }
    ) {
        this.substitutionFormArray.push(this.fb.group({
            authorizingPrescription: [''],
            wasSubstituted: [''],
            reason: [''],
            type: ['']
        }));

        const lastIndex = this.substitutionFormArray.length - 1;
        if (values) {
            this.substitutionFormArray.at(lastIndex).patchValue({
                authorizingPrescription: values.authorizingPrescription || '',
                wasSubstituted: values.wasSubstituted || '',
                reason: values.reason || '',
                type: values.type || ''
            });
        }
    }
    newMedicationCodeableConcept: { [key: string]: CodeableConcept | null } = {}
    newMedicationReference: { [key: string]: Reference | null } = {}
    medicationDispenseFieldFilterService = inject(MedicationDispenseFieldFilterService);
    dialog = inject(MatDialog)
    fhirResourceTransformService = inject(FhirResourceTransformService);
    openSubstitutionForm(medicationRequestId: string) {

        const formFields = [
            ...this.medicationDispenseFieldFilterService.filterFormFields([...this.formFields[0]], ['medicationReference']),
            ...this.medicationDispenseFieldFilterService.filterFormFields([...this.formFields[0]], ['substitution']),

        ];
        const df = this.dialog.open(DynamicFormsV2Component, {
            maxHeight: '93vh',
            data: {
                formFields: formFields,
                formMetaData: <formMetaData>{
                    formName: 'Medication Substitution',
                    formDescription: 'Provide details for medication substitution.',
                    submitText: 'Submit',
                    closeDialogOnSubmit: true,

                }

            }
        });

        df.afterClosed().subscribe((e: any) => {
            // alert(JSON.stringify(e.values))
            if (e.values) {

                this.searchAndUpdateControlsInSubstitutionArray({
                    authorizingPrescription: medicationRequestId
                }, {
                    newValue: {
                        wasSubstituted: true, type: this.fhirResourceTransformService.toCodeableConcept(e.values.substitution.substitution_type),
                        reason: this.fhirResourceTransformService.toCodeableConcept(e.values.substitution.substitution_reason)
                    }
                });
                if (e.values.medicationReference) {
                    this.newMedicationReference[medicationRequestId || ''] = this.fhirResourceTransformService.toReference(e.values.medicationReference);
                    this.searchAndUpdateControlsInSubstitutionArray({
                        authorizingPrescription: medicationRequestId
                    }, {
                        newValue: {
                            medicationReference: this.fhirResourceTransformService.toReference(e.values.medicationReference)
                        }
                    }, this.MedicationReferenceArray);
                }
                this.putTogether();
            }

        })


    }
    medicationReferenceFallBackForm = this.fb.group({
        medicationReferenceArray: this.fb.array([])
    });
    //addtit
    get MedicationReferenceArray() {
        return this.medicationReferenceFallBackForm.get('medicationReferenceArray') as FormArray;
    }
    combinedResource: any[] = [];
    addToMedicationReferenceArray(value: { authorizingPrescription?: string, medicationReference?: Reference }) {
        this.MedicationReferenceArray.push(this.fb.group({
            medicationReference: [value.medicationReference || null],
            authorizingPrescription: [value.authorizingPrescription || '']
        }));
    }

    reverseSubstitution(medicationRequestId: string) {
        const updatedCount = this.searchAndUpdateControlsInSubstitutionArray({
            authorizingPrescription: medicationRequestId
        }, {
            newValue: {
                wasSubstituted: false, type: undefined,
                reason: undefined
            }
        });
        this.newMedicationReference[medicationRequestId || ''] = null;
        this.searchAndUpdateControlsInSubstitutionArray({
            authorizingPrescription: medicationRequestId
        }, {
            newValue: {
                medicationReference: ""
            }
        }, this.MedicationReferenceArray);
        this.putTogether();
    }
    searchAndUpdateControlsInSubstitutionArray(
        searchObject: { [key: string]: string },
        options: {
            newValue?: unknown;
            updater?: (control: AbstractControl, key: string, group: FormGroup) => void;
        } = {},
        form: FormArray = this.substitutionFormArray
    ): any {
        const normalizedSearch = !!searchObject
        if (!normalizedSearch) return 0;
        const targetArray = form;
        if (!targetArray?.length) return 0;

        let updatedVal: any = null;
        targetArray.controls.forEach(control => {
            // const isThis: boolean = false;
            if (!(control instanceof FormGroup)) return;
            Object.entries(control.controls).forEach(([key, child]) => {
                if (!key || !child) return;
                const keyFound = Object.keys(searchObject).find(k => key.toLowerCase() === k.toLowerCase());
                const valueFound = keyFound ? searchObject[keyFound] === child.value : undefined;
                if (valueFound) {
                    // alert('found');



                    // updatedCount++;
                    if (options.updater) {
                        options.updater(child, key, control);
                    } else if (options.newValue !== undefined && 'setValue' in child) {
                        // alert(JSON.stringify(options.newValue));
                        if (options.newValue) {
                            control.patchValue(options.newValue || {});

                        }

                    }
                    child.markAsTouched();
                    child.markAsDirty();
                    updatedVal = { ...control.value, ...(options?.newValue || {}) };


                }
            });
        });
        delete updatedVal?.authorizingPrescription;
        // alert(JSON.stringify(updatedVal))
        return updatedVal;
    }

    medicationRequestId: (string | null)[] = [];

    formMetaData = {
        formName: 'Medication Dispense',
        formDescription: 'Use this form to record a medication dispense.',
        submitText: 'Submit Dispense'
    };
    medicationRefenceFormField: FormFields[][] | null[] = [null];
    remainingDispenseFormFields: FormFields[][] = [];
    ngOnInit() {
        if (!this.data.groupId) {
            this.medicationRefenceFormField[0] = this.medicationDispenseFieldFilterService.filterFormFields([...this.formFields[0]], ['medicationReference']);
            this.remainingDispenseFormFields[0] = this.medicationDispenseFieldFilterService.removeFormFields([...this.formFields[0]], ['medicationReference', 'substitution', 'medicationCodeableConcept']);
            this.addToMedicationReferenceArray({ authorizingPrescription: this.data.medicationRequestId, medicationReference: this.data.medicationReference ?? '' });

        }


    }
    @ViewChild('mrF') medicationReferenceFormComponent!: DynamicFormsV2Component;
    //#rf
    @ViewChild('rf') remainingDispenseFormComponent!: DynamicFormsV2Component;
    ngAfterViewInit() {
        this.remainingDispenseFormComponent?.aForm.valueChanges.subscribe((val: any) => {
            this.putTogether();
        });
        this.medicationReferenceFormComponent?.aForm.valueChanges.subscribe((val: any) => {
            this.putTogether();
        });
        if (!this.data.groupId) {

            this.medicationReferenceFormComponent?.aForm?.get(['medicationReference'])?.valueChanges.subscribe((val: any) => {

                // alert(JSON.stringify(this.fhirResourceTransformService.toReference(val)))
                this.searchAndUpdateControlsInSubstitutionArray({
                    authorizingPrescription: this.medicationRequestId[0] || ''
                }, {
                    newValue: {
                        medicationReference: this.fhirResourceTransformService.toReference(val)
                    }
                }, this.MedicationReferenceArray);
            })
        }
    }
    medicationCodeableConcept: CodeableConcept[] | null[] = [null];
    medicationReference: Reference[] | null[] = [null];
    subject: Reference[] | null[] = [null];
    groupId: string | null = null;



    putTogether() {
        this.combinedResource = [];
        for (let i = 0; i < this.formFields.length; i++) {
            //medRef can be from fallback form if med.req opened without groupId
            // const medRef = this.MedicationReferenceArray.at(i)?.get('medicationReference')?.value || this.medicationReference[i] || null;
            let medRef = this.searchAndUpdateControlsInSubstitutionArray({ authorizingPrescription: this.medicationRequestId[i] || '' }, {}, this.MedicationReferenceArray);
            medRef = medRef?.medicationReference || this.medicationReference[i] || null;
            const substitutionInfo = this.searchAndUpdateControlsInSubstitutionArray({ authorizingPrescription: this.medicationRequestId[i] || '' }, {},
                this.substitutionFormArray
            );
            this.combinedResource.push({
                // medicationCodeableConcept: this.medicationCodeableConcept[i] || null,
                medicationReference: medRef,
                substitution: substitutionInfo,
                authorizingPrescription: this.medicationRequestId[i],
                ...this.fhirResourceTransformService.transformValues('MedicationDispense', this.remainingDispenseFormComponent.aForm.value),
                performer: {
                    actor: this.fhirResourceTransformService.toReference(this.remainingDispenseFormComponent.aForm?.value?.performerActor)
                },
                dosageInstruction: {
                    text: this.remainingDispenseFormComponent.aForm?.value?.['dosageInstruction.text'] || undefined
                },
                whenHandedOver: this.remainingDispenseFormComponent.aForm?.value?.['whenHandedOver'] || new Date().toISOString(),
                quantity: { value: this.remainingDispenseFormComponent.aForm?.value?.quantity || null }
                // receiver: this.fhirResourceTransformService.toReferenceArray(this.remainingDispenseFormComponent.aForm?.value?.receiver)
                // groupId: this.groupId,
                // formFields: this.formFields[i],
                // medicationRequestId: this.medicationRequestId[i] || null
            });
            if (this.combinedResource[i].substitution === null
                || !this.combinedResource[i]?.substitution?.wasSubstituted) {
                delete this.combinedResource[i].substitution;
            }
            delete this.combinedResource[i].performerActor;
            delete this.combinedResource[i]['dosageInstruction.text'];
            if (this.combinedResource[i]?.dosageInstruction?.text === undefined) {
                delete this.combinedResource[i].dosageInstruction;
            }
            // if receiver is empty, add subject
            if (!this.combinedResource[i]?.receiver || this.combinedResource[i]?.receiver?.length === 0
                || (this.combinedResource[i]?.receiver[0] === '' && this.combinedResource[i]?.receiver.length === 1)

            ) {
                this.combinedResource[i].receiver = [this.combinedResource[i].subject];
            }
        }
    }




    constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
        if (!data.groupId) {
            // alert(JSON.stringify(data.medicationReference))
            this.medicationCodeableConcept = data.medicationCodeableConcept ? [data.medicationCodeableConcept] : [null];
            this.medicationReference = data.medicationReference ? [data.medicationReference] : [null];
            this.subject = data.subject ? [data.subject] : [null];

            this.groupId = data.groupId;
            this.formFields = [data.formFields];
            this.medicationRequestId = data.medicationRequestId ? [data.medicationRequestId] : [null];
            this.addToSubstitutionArray({
                authorizingPrescription: data.medicationRequestId,
                wasSubstituted: undefined,
                reason: undefined,
                type: undefined
            })
            this.newMedicationCodeableConcept[data.medicationRequestId || ''] = null
            this.newMedicationReference[data.medicationRequestId || ''] = null

        } else {
            // get med.req where groupId == data.groupId
            this.http.get<{ entry: { resource: any }[] }>(`${this.backendEndPoint}/MedicationRequest`).pipe(
                map(res => res.entry?.map(e => e.resource).filter(r => r.groupIdentifier?.value === data.groupId) || [])
            ).subscribe({
                next: (medRequests) => {
                    for (let i = 0; i < medRequests.length; i++) {
                        if (!this.formFields) this.formFields = [];
                        this.formFields.push(this.data.formFields)
                    }
                    this.medicationCodeableConcept = medRequests.map(mr => mr.medicationCodeableConcept || null);
                    this.medicationReference = medRequests.map(mr => mr.medicationReference || null);
                    this.subject = medRequests.map(mr => mr.subject || null);
                    this.groupId = data.groupId;

                    medRequests.forEach((mr, index) => {
                        //FILL relevant frmfield
                        this.formFields[index] = this.formFields[index].map((ff: FormFields): FormFields => {
                            if (ff.generalProperties.fieldApiName === 'medicationCodeableConcept' && mr.medicationCodeableConcept) {
                                ff.generalProperties.value = mr.medicationCodeableConcept;
                                ff.generalProperties.isHidden = true;
                            }
                            if (ff.generalProperties.fieldApiName === 'medicationReference' && mr.medicationReference) {
                                ff.generalProperties.value = mr.medicationReference;
                                ff.generalProperties.isHidden = true;
                            }
                            if (ff.generalProperties.fieldApiName === 'subject' && mr.subject) {
                                ff.generalProperties.value = mr.subject;
                                ff.generalProperties.isHidden = true;

                            }

                            if (ff.generalProperties.fieldApiName === 'authorizingPrescription' && mr.id) {
                                ff.generalProperties.value = [{
                                    reference: `MedicationRequest/${mr.id}`
                                }];
                                ff.generalProperties.isHidden = true;

                            }
                            if (mr.id) {
                                this.addToSubstitutionArray({
                                    authorizingPrescription: mr.id,
                                });
                            }

                            return <FormFields>ff;
                        })

                    });
                },

                error: () => {
                    this.errorService.openandCloseError('Failed to load medication requests for the given group.');
                    // this.dialogRef.close(); 
                }
            });

        }

    }

    private buildFormFields(g: any): FormFields[] {
        return [
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
                    fieldApiName: 'medicationReference',
                    fieldName: 'Medication Reference',
                    fieldLabel: 'Medication Reference',
                    fieldType: 'IndividualReferenceField',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    isArray: false,
                    isGroup: false,
                    isHidden: !g.medicationReference || g.medicationReference.length === 0
                },
                data: g.medicationReference
            },
            {
                generalProperties: {
                    fieldApiName: 'medicationCodeableConcept',
                    fieldName: 'Medication Codeable Concept',
                    fieldLabel: 'Medication Codeable Concept',
                    fieldType: 'CodeableConceptField',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    isArray: false,
                    isGroup: false
                },
                data: g.medication
            },
            <IndividualField>{
                generalProperties: {
                    fieldApiName: 'quantity',
                    fieldName: 'Quantity Dispensed',
                    fieldLabel: 'Quantity Dispensed',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    inputType: 'number',
                    fieldType: 'IndividualField',
                    isArray: false,
                    isGroup: false
                }
            },
            <IndividualField>{
                generalProperties: {
                    fieldApiName: 'recordedDate',
                    fieldName: 'Recorded Date',
                    fieldLabel: 'Recorded Date',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    inputType: 'datetime-local',
                    value: new Date().toISOString(),
                    isArray: false,
                    isGroup: false,
                    isHidden: true
                }
            },
            <IndividualField>{
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
                    isArray: true,
                    isGroup: false
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
                    isArray: true,
                    isGroup: false
                },
                data: g.performer
            },
            {
                generalProperties: {
                    fieldApiName: 'authorizingPrescription',
                    fieldName: 'Authorizing Prescription',
                    fieldLabel: 'Authorizing Prescription',
                    fieldType: 'IndividualReferenceField',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    isArray: false,
                    isGroup: false
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
                    isGroup: false
                },
                data: g.subject
            },
            <IndividualField>{
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
            {
                generalProperties: {
                    fieldApiName: 'substitution',
                    fieldName: 'Substitution Info',
                    fieldLabel: 'Substitution Info',
                    fieldType: 'CodeField',
                    auth: { read: 'all', write: 'doctor, nurse' },
                    isArray: false,
                    isGroup: true
                },
                keys: ['wasSubstituted', 'substitutionReason', 'substitutionType'],
                groupFields: {
                    wasSubstituted: {
                        generalProperties: {
                            fieldApiName: 'substitution_wasSubstituted',
                            fieldName: 'Was Substituted',
                            fieldLabel: 'Was Substituted',
                            fieldType: 'SingleCodeField',
                            inputType: 'toggle',
                            auth: { read: 'all', write: 'doctor, nurse' },
                            isArray: false,
                            isGroup: false
                        },
                        data: ['Yes', 'No']
                    },
                    substitutionReason: {
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
                    substitutionType: {
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
                }
            }
        ];
    }

    onSubmit(values: any) {

        if (!values) return;
        const quantity = this.parseQuantity(values.quantity);
        const medRef = this.coerceReference(values.medicationReference);
        this.prepareBundle(values, quantity, medRef).subscribe({
            next: (entries) => this.postBundle(entries),
            error: () => this.errorService.openandCloseError('Failed to prepare dispense payload.')
        });
    }

    private prepareBundle(entry: any, quantity: number, medRef?: { reference: string }) {
        if (medRef?.reference && quantity > 0) {
            const medId = this.extractResourceId(medRef.reference);
            if (!medId) return of(this.buildEntries(entry, quantity, medRef));
            return this.http.get<Medication>(`${this.backendEndPoint}/Medication/${medId}`).pipe(
                map(medication => this.buildEntries(entry, quantity, medRef, medication, medId))
            );
        }
        return of(this.buildEntries(entry, quantity, medRef));
    }

    private buildEntries(entry: any, quantity: number, medRef?: { reference: string }, medication?: Medication, medId?: string) {
        const dispense = this.buildMedicationDispenseResource(entry, quantity, medRef);
        const entries: any[] = [];
        if (medication && medId) {
            const updated = this.buildMedicationUpdatePayload(medication, quantity);
            if (updated) {
                entries.push({
                    resource: { ...updated, resourceType: 'Medication', id: medId },
                    request: { method: 'PUT', url: `Medication/${medId}` }
                });
            }
        }
        entries.push({
            resource: dispense,
            request: { method: 'POST', url: 'MedicationDispense' }
        });
        return entries;
    }

    private postBundle(entries: any[]) {
        const bundle: { resourceType: 'Bundle', type: 'transaction', entry: any[] } = { resourceType: 'Bundle', type: 'transaction', entry: entries };
        this.fhirResourceService.postBundle(bundle).subscribe({
            next: () => {
                this.snackBar.openFromComponent(SuccessMessageComponent, {
                    data: { message: 'Medication dispense saved successfully.' },
                    duration: 3000
                });
                this.dialogRef.close();
            },
            error: () => this.errorService.openandCloseError('Failed to submit dispense bundle.')
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
        return resource;
    }

    private buildMedicationUpdatePayload(medication: Medication, quantity: number): Medication | undefined {
        const totalRemainingExt = this.findInventoryExtension(medication);
        // const totalRemainingExt = this.findInventoryField(inventory, 'totalRemaining');
        if (!totalRemainingExt) return undefined;
        const cloned = JSON.parse(JSON.stringify(medication));
        const clonedField = this.findInventoryExtension(cloned);
        // const clonedField = this.findInventoryField(clonedInventory, 'totalRemaining');
        console.log('clonedField', clonedField);
        console.log('totalRemainingExt', totalRemainingExt);
        if (!clonedField) return undefined;
        const current = Number(totalRemainingExt.valueQuantity?.value ?? totalRemainingExt.valueInteger ?? totalRemainingExt.valueString ?? 0);
        const updatedValue = Math.max(0, current - quantity);
        //quntity, updatedVal
        console.log('current', current, 'updatedValue', updatedValue);
        if (clonedField.valueQuantity) {
            clonedField.valueQuantity.value = updatedValue;
        } else {
            clonedField.valueInteger = updatedValue;
        }
        cloned.extension.map((ext: any) => {
            if (ext.url === clonedField.url) {
                return clonedField;
            }
        });
        console.log(cloned);
        return cloned;
    }

    private findInventoryExtension(medication: Medication): any | undefined {
        return medication?.extension?.find((ext: any) =>
            typeof ext.url === 'string' && ext.url.endsWith('totalRemaining')
        );
    }

    private findInventoryField(inventory: any, key: string): any | undefined {
        return inventory?.extension?.find((ext: any) =>
            ext?.url === key || (typeof ext?.url === 'string' && ext.url.endsWith(`/${key}`))
        );
    }

    private getInventoryUnit(medication: any): string | undefined {
        return medication?.extension?.find((ext: any) =>
            typeof ext.url === 'string' && ext.url.endsWith('dispensableUnits')
        )?.valueString;
        // return unitExt.valueString || unitExt.valueCodeableConcept?.text || unitExt.valueCodeableConcept?.coding?.[0]?.display;
    }

    private coerceReference(input: any): { reference: string; display?: string } | undefined {
        if (!input) return undefined;
        if (typeof input === 'string') {
            const parts = input.split('$#$').map(p => p.trim());
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

    submitCombinedDispenseBundle() {
        this.putTogether();
        const entries = this.combinedResource?.filter(Boolean) ?? [];
        if (!entries.length) {
            this.errorService.openandCloseError('No dispense data is available.');
            return;
        }

        const validationError = this.validateDispenseEntries(entries);
        if (validationError) {
            this.errorService.openandCloseError(validationError);
            return;
        }

        const payloads = entries.map((entry) => this.prepareDispensePayloadEntry(entry));
        forkJoin(payloads)
            .pipe(
                map((items) =>
                    items.flatMap((item: any) => {
                        const bundleEntries: any[] = [];
                        if (item.medicationUpdate) {
                            bundleEntries.push({
                                resource: {
                                    ...item.medicationUpdate.resource,
                                    resourceType: 'Medication',
                                    id: item.medicationUpdate.id
                                },
                                request: { method: 'PUT', url: `Medication/${item.medicationUpdate.id}` }
                            });
                        }
                        if (item.dispenseResource) {
                            bundleEntries.push({
                                resource: {
                                    ...item.dispenseResource,
                                    resourceType: 'MedicationDispense'
                                },
                                request: { method: 'POST', url: 'MedicationDispense' }
                            });
                        }
                        return bundleEntries;
                    })
                )
            )
            .subscribe({
                next: (bundleEntries) => {
                    if (!bundleEntries.length) {
                        this.errorService.openandCloseError('Failed to build dispense bundle.');
                        return;
                    }
                    this.fhirResourceService.postBundle({ resourceType: 'Bundle', type: 'transaction', entry: bundleEntries }).subscribe({
                        next: () => {
                            this.snackBar.openFromComponent(SuccessMessageComponent, {
                                data: { message: 'Medication dispense saved successfully.' },
                                duration: 3000
                            });
                        },
                        error: () => this.errorService.openandCloseError('Failed to submit dispense bundle.')
                    });
                },
                error: (err) => {
                    console.error('[meddispense] preparation failed', err);
                    this.errorService.openandCloseError(err?.message || 'Failed to prepare dispense bundle.');
                }
            });
    }

    private validateDispenseEntries(entries: any[]): string | null {
        for (const entry of entries) {
            // alert(JSON.stringify(entry))
            const quantity = this.parseQuantity(entry?.quantity);
            const medicationReference = this.coerceReference(entry?.medicationReference);
            if (!medicationReference?.reference) {
                return 'Each dispense requires a medication reference.';
            }
            if (!Number.isFinite(quantity) || quantity <= 0) {
                return 'A valid quantity is required for every dispense.';
            }
        }
        return null;
    }

    private prepareDispensePayloadEntry(entry: any) {
        const quantity = this.parseQuantity(entry?.quantity);
        const medRef = this.coerceReference(entry?.medicationReference);
        const medId = this.extractResourceId(medRef?.reference);
        if (!medRef?.reference) {
            throw new Error('Missing medication reference for dispense entry.');
        }
        if (!medId) {
            const dispenseResource = this.buildMedicationDispenseResource(entry, quantity, medRef);
            return of({ dispenseResource });
        }
        return this.http.get<Medication>(`${this.backendEndPoint}/Medication/${medId}`, {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache'
            }
        }).pipe(
            map((medication) => {
                console.log('[meddispense] fetched medication', medication);
                const totalRemaining = this.findInventoryExtension(medication);
                // const totalRemaining = this.findInventoryField(inventory, 'totalRemaining');
                console.log('[meddispense] found inventory', totalRemaining);
                const remaining = Number(
                    totalRemaining?.valueQuantity?.value ??
                    totalRemaining?.valueInteger ??
                    totalRemaining?.valueString ??
                    NaN
                );
                if (Number.isFinite(remaining) && quantity > remaining) {
                    throw new Error(`Requested quantity exceeds available stock which is ${remaining}.`);
                }
                if (quantity <= 0) {
                    throw new Error('Requested quantity must be greater than zero.');
                }
                const medicationUpdate = this.buildMedicationUpdatePayload(medication, quantity);
                const unit = this.getInventoryUnit(medication);

                // const dispenseResource = this.buildMedicationDispenseResource(entry, quantity, medRef, unit);
                return {
                    dispenseResource: { ...entry, quantity: { ...entry.quantity, unit: unit ?? '' } },
                    medicationUpdate: medicationUpdate ? { id: medId, resource: medicationUpdate } : undefined
                };
            })
        );
    }
}
