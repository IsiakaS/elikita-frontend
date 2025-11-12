import { Component, inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Patient } from 'fhir/r4';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { PatientDataReviewComponent, FieldEditEvent } from '../shared/patient-data-review/patient-data-review.component';
import { formMetaData } from '../shared/dynamic-forms.interface';
import { CodeableConceptField, CodeField, GroupField, IndividualField } from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { FieldConfigFactoryService } from '../shared/field-config-factory.service';

@Component({
    selector: 'app-patient-registration-edit',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTabsModule, PatientDataReviewComponent],
    template: `
  <h2 mat-dialog-title>Edit Patient</h2>
  <div class="edit-dialog">
    <div class="tab-scroller">
        <mat-tab-group #tabGroup>
    <mat-tab label="Patient Details">
    <app-patient-data-review
      *ngIf="designatedFormFields && designatedSubmittedData"
      [formFields]="designatedFormFields"
      [submittedData]="designatedSubmittedData"
            (fieldEdited)="onDetailsEdited($event)"
                (navigateNext)="goNextTabOrSave()"
                (navigatePrev)="goPrevTab()"></app-patient-data-review>
    </mat-tab>
    <mat-tab label="Guardian">
    <app-patient-data-review
      *ngIf="guardianFormFields && guardianSubmittedData"
      [formFields]="guardianFormFields"
      [submittedData]="guardianSubmittedData"
            (fieldEdited)="onGuardianEdited($event)"
                (navigateNext)="goNextTabOrSave()"
                (navigatePrev)="goPrevTab()"></app-patient-data-review>
    </mat-tab>
    <mat-tab label="Attachments">
    <app-patient-data-review
      *ngIf="attachmentFormFields && attachmentsSubmittedData"
      [formFields]="attachmentFormFields"
      [submittedData]="attachmentsSubmittedData"
            (fieldEdited)="onAttachmentsEdited($event)"
                (navigateNext)="goNextTabOrSave()"
                (navigatePrev)="goPrevTab()"></app-patient-data-review>
    </mat-tab>
    </mat-tab-group>
    </div>
  <div class="actions g-just-flex gap-10 justify-content-end mt-15">
    <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
    <button mat-flat-button color="primary" type="button" (click)="save()">Save</button>
  </div>
  </div>
  `,
    styles: [`
    .edit-dialog{min-width: 720px; max-width: 92vw; max-height: 93vh; display: flex; flex-direction: column; box-sizing: border-box;}
    .tab-scroller{flex: 1 1 auto; overflow: auto; padding: 8px 4px 12px;}
    .actions{padding: 8px 0 4px;}
    @media (max-width: 768px){ .edit-dialog{min-width: auto; width: 92vw;} }
  `]
})
export class PatientRegistrationEditComponent {
    // Reference to the tab group for programmatic navigation
    @ViewChild('tabGroup') tabGroup?: MatTabGroup;
    dialogRef = inject(MatDialogRef<PatientRegistrationEditComponent>);
    data = inject(MAT_DIALOG_DATA) as Patient;
    // Field configs
    designatedRegForm?: formMetaData;
    designatedFormFields?: (IndividualField | CodeField | CodeableConceptField | GroupField)[];
    guardianRegForm?: formMetaData;
    guardianFormFields?: (IndividualField | CodeField | CodeableConceptField | GroupField)[];
    attachmentFormFields?: GroupField[];

    // Submitted-like data mapped from FHIR
    designatedSubmittedData: any;
    guardianSubmittedData: any;
    attachmentsSubmittedData: any;

    workingPatient: Patient;
    selectService = inject(FormFieldsSelectDataService);
    fieldFactory = inject(FieldConfigFactoryService);

    constructor() {
        // Start from a clone to avoid mutating the input
        this.workingPatient = JSON.parse(JSON.stringify(this.data || { resourceType: 'Patient' }));
        // Strip any UI-only synthetic fields (like 'status') defensively
        delete (this.workingPatient as any).status;
    }

    ngOnInit() {
        // Build field configs similar to registration for Patient + Guardian
        this.prepareFieldConfigs().then(() => {
            // Map incoming FHIR Patient to submitted-like data shapes the review component expects
            this.designatedSubmittedData = this.mapPatientToDesignated(this.workingPatient);
            this.guardianSubmittedData = this.mapPatientToGuardian(this.workingPatient);
            this.attachmentsSubmittedData = this.mapPatientToAttachments(this.workingPatient);
        });
    }

    async prepareFieldConfigs() {
        // Use shared builder service; leave patient-registration.component untouched
        this.designatedRegForm = { formName: 'Patient Details' } as formMetaData;
        this.designatedFormFields = await this.fieldFactory.buildPatientDetailsFields({ mode: 'edit' });

        this.guardianRegForm = { formName: 'Guardian' } as formMetaData;
        this.guardianFormFields = await this.fieldFactory.buildGuardianFields({ includeGuardianGender: false });

        this.attachmentFormFields = this.fieldFactory.buildAttachmentFields();
    }

    // Mapping helpers
    private mapPatientToDesignated(p: Patient): any {
        const name = (p.name && p.name[0]) || ({} as any);
        const telecom = p.telecom || [];
        const phone = telecom.filter(t => t.system === 'phone');
        const email = telecom.filter(t => t.system === 'email');
        const other = telecom.filter(t => t.system !== 'phone' && t.system !== 'email');
        return {
            active: p.active ?? true,
            name: {
                title: name.prefix?.[0] || '',
                family: name.family || '',
                given: name.given?.[0] || '',
                otherNames: name.given && name.given.length > 1 ? name.given.slice(1).join(' ') : ''
            },
            gender: p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) : undefined,
            birthDate: p.birthDate,
            address: p.address || [],
            phone_telecom: phone,
            email_telecom: email,
            telecom: other,
            maritalStatus: p.maritalStatus ? this.stringifyCodeableConcept(p.maritalStatus) : undefined,
        };
    }

    private mapPatientToGuardian(p: Patient): any {
        const c = (p.contact && p.contact[0]) || ({} as any);
        const telecom: any[] = c.telecom || [];
        const phone = telecom.filter(t => t.system === 'phone');
        const email = telecom.filter(t => t.system === 'email');
        return {
            name: {
                title: c.name?.prefix?.[0] || '',
                family: c.name?.family || '',
                given: c.name?.given?.[0] || '',
                otherNames: c.name?.given && c.name?.given.length > 1 ? c.name?.given.slice(1).join(' ') : ''
            },
            relationship: c.relationship?.[0] ? this.stringifyCodeableConcept(c.relationship[0]) : undefined,
            phone_telecom: phone,
            email_telecom: email,
            address: c.address ? [c.address] : []
        };
    }

    private mapPatientToAttachments(p: Patient): any {
        return {
            photo: (p.photo || []).map(att => ({
                title: att.title || '',
                url: att.url || '',
                contentType: att.contentType || '',
                creation: att.creation || ''
            }))
        };
    }

    private stringifyCodeableConcept(cc: any): string | undefined {
        const c = cc?.coding?.[0];
        if (!c) return undefined;
        return `${c.code}$#$${c.display}$#$${c.system}`;
    }

    // Edit handlers
    onDetailsEdited(event: FieldEditEvent) {
        if (!this.designatedSubmittedData) return;
        if (event.isArray && event.arrayIndex !== undefined) {
            this.designatedSubmittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
        } else if (event.fieldApiName.includes('.')) {
            // nested keys not expected here
        } else {
            this.designatedSubmittedData[event.fieldApiName] = event.newValue;
        }
        this.applyDetailsToPatient();
    }

    onGuardianEdited(event: FieldEditEvent) {
        if (!this.guardianSubmittedData) return;
        if (event.isArray && event.arrayIndex !== undefined) {
            this.guardianSubmittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
        } else {
            this.guardianSubmittedData[event.fieldApiName] = event.newValue;
        }
        this.applyGuardianToPatient();
    }

    onAttachmentsEdited(event: FieldEditEvent) {
        if (!this.attachmentsSubmittedData) return;
        if (event.isArray && event.arrayIndex !== undefined) {
            this.attachmentsSubmittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
        } else {
            this.attachmentsSubmittedData[event.fieldApiName] = event.newValue;
        }
        this.applyAttachmentsToPatient();
    }

    private applyDetailsToPatient() {
        const d = this.designatedSubmittedData || {};
        const name = d.name || {};
        this.workingPatient.active = d.active ?? this.workingPatient.active;
        this.workingPatient.name = [{
            use: 'official',
            prefix: name.title ? [name.title] : undefined,
            family: name.family,
            given: [name.given, ...(name.otherNames ? [name.otherNames] : [])].filter(Boolean)
        } as any];
        this.workingPatient.gender = d.gender ? (d.gender as string).toLowerCase() as any : this.workingPatient.gender;
        this.workingPatient.birthDate = d.birthDate || undefined;
        this.workingPatient.address = d.address || [];
        // marital status
        this.workingPatient.maritalStatus = this.parseCodeableConcept(d.maritalStatus);
        // merge telecom arrays
        const telecom: any[] = [];
        if (Array.isArray(d.phone_telecom)) telecom.push(...d.phone_telecom.map((t: any) => ({ ...t, system: 'phone' })));
        if (Array.isArray(d.email_telecom)) telecom.push(...d.email_telecom.map((t: any) => ({ ...t, system: 'email' })));
        if (Array.isArray(d.telecom)) telecom.push(...d.telecom);
        this.workingPatient.telecom = telecom;
    }

    private parseCodeableConcept(value?: string): any | undefined {
        if (!value) return undefined;
        const parts = value.split('$#$');
        if (parts.length >= 3) {
            return { coding: [{ code: parts[0], display: parts[1], system: parts[2] }], text: parts[1] };
        }
        return undefined;
    }

    private applyGuardianToPatient() {
        const g = this.guardianSubmittedData || {};
        const contact: any = {};
        if (g.relationship) contact.relationship = [this.parseCodeableConcept(g.relationship)];
        if (g.name) {
            contact.name = {
                use: 'official',
                prefix: g.name.title ? [g.name.title] : undefined,
                family: g.name.family,
                given: [g.name.given, ...(g.name.otherNames ? [g.name.otherNames] : [])].filter(Boolean)
            };
        }
        const telecom: any[] = [];
        if (Array.isArray(g.phone_telecom)) telecom.push(...g.phone_telecom.map((t: any) => ({ ...t, system: 'phone' })));
        if (Array.isArray(g.email_telecom)) telecom.push(...g.email_telecom.map((t: any) => ({ ...t, system: 'email' })));
        if (telecom.length) contact.telecom = telecom;
        if (Array.isArray(g.address) && g.address[0]) contact.address = g.address[0];
        this.workingPatient.contact = [contact];
    }

    private applyAttachmentsToPatient() {
        const a = this.attachmentsSubmittedData || {};
        if (Array.isArray(a.photo)) {
            this.workingPatient.photo = a.photo.map((p: any) => ({
                title: p.title || undefined,
                url: p.url || undefined,
                contentType: p.contentType || undefined,
                creation: p.creation || undefined,
            }));
        }
    }

    save() {
        // Prune empty arrays/objects before returning to reduce payload size (mirrors registration component logic)
        const pruned = this.pruneFHIRArrays(structuredClone ? structuredClone(this.workingPatient) : JSON.parse(JSON.stringify(this.workingPatient)));
        this.dialogRef.close({ updated: true, resource: pruned });
    }

    // Advance to next tab, or save if on the last tab
    goNextTabOrSave() {
        if (!this.tabGroup) return;
        const current = this.tabGroup.selectedIndex ?? 0;
        // Try public tabs first; fall back to private _tabs for compatibility
        const total = ((this.tabGroup as any).tabs?.length ?? (this.tabGroup as any)._tabs?.length ?? 0) as number;
        if (current < total - 1) {
            this.tabGroup.selectedIndex = current + 1;
        } else {
            this.save();
        }
    }

    // Move to previous tab if available
    goPrevTab() {
        if (!this.tabGroup) return;
        const current = this.tabGroup.selectedIndex ?? 0;
        if (current > 0) {
            this.tabGroup.selectedIndex = current - 1;
        }
    }

    // Recursive prune borrowed from registration (keeps false/0, removes empty strings, empty objs/arrays)
    private pruneFHIRArrays<T>(input: T): T {
        const isEmptyPrimitive = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
        const prune = (val: any): any => {
            if (Array.isArray(val)) {
                return val.map(prune).filter(item => {
                    if (Array.isArray(item)) return item.length > 0;
                    if (item && typeof item === 'object') return Object.keys(item).length > 0;
                    return !isEmptyPrimitive(item);
                });
            }
            if (val && typeof val === 'object') {
                const out: any = {};
                for (const [k, v] of Object.entries(val)) {
                    const pv = prune(v);
                    if (typeof pv === 'number' || typeof pv === 'boolean') { out[k] = pv; continue; }
                    if (Array.isArray(pv)) { if (pv.length) out[k] = pv; continue; }
                    if (pv && typeof pv === 'object') { if (Object.keys(pv).length) out[k] = pv; continue; }
                    if (!isEmptyPrimitive(pv)) out[k] = pv;
                }
                return out;
            }
            return val;
        };
        return prune(input);
    }
}
