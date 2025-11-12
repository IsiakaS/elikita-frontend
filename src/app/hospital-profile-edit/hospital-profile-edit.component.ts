import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ResourceDataReviewComponent } from '../shared/resource-data-review/resource-data-review.component';
import { GroupField, IndividualField, CodeField, CodeableConceptField, formMetaData } from '../shared/dynamic-forms.interface2';
import { Organization } from 'fhir/r4';

// Union type for dynamic form field configurations
type AnyField = IndividualField | CodeField | CodeableConceptField | GroupField;

@Component({
    selector: 'app-hospital-profile-edit',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, ResourceDataReviewComponent],
    template: `
    <mat-card class="hospital-profile-edit">
      <mat-card-header>
        <mat-card-title>Edit Hospital Profile</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-resource-data-review
          [resource]="organization"
          [formFields]="formFields"
          [submittedData]="submittedData"
          [applySubmittedDataToResource]="applySubmittedToOrganization.bind(this)"
          [showEditButtons]="true"
          (resourceUpdated)="organization = $event"
        ></app-resource-data-review>
      </mat-card-content>
      <mat-card-actions class="actions g-just-flex gap-10" style="justify-content: flex-end;">
        <button mat-stroked-button color="primary" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" (click)="onSave()">Save</button>
      </mat-card-actions>
    </mat-card>
  `,
    styles: [`
    .hospital-profile-edit { max-width: 760px; margin: 0 auto; }
  `]
})
export class HospitalProfileEditComponent implements OnInit {
    dialog = inject(MatDialog);
    organization: Organization = { resourceType: 'Organization', name: 'Sample Hospital' };
    formFields: AnyField[] = [];
    submittedData: any;

    ngOnInit() {
        this.buildFieldConfigs();
        this.submittedData = this.mapOrganizationToSubmitted(this.organization, this.formFields);
    }

    buildFieldConfigs() {
        // Minimal editable fields for demo; expand as needed
        this.formFields = [
            <IndividualField>{
                generalProperties: { fieldApiName: 'name', fieldName: 'Name', fieldLabel: 'Name', fieldType: 'IndividualField', isArray: false, isGroup: false }
            },
            <IndividualField>{
                generalProperties: { fieldApiName: 'description', fieldName: 'Description', fieldLabel: 'Description', fieldType: 'IndividualField', inputType: 'textarea', isArray: false, isGroup: false }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'phone_telecom', fieldName: 'Phone', fieldLabel: 'Phone', fieldType: 'IndividualField', isArray: false, isGroup: true },
                keys: ['value'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Phone', fieldLabel: 'Phone', isArray: false, isGroup: false } }
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'email_telecom', fieldName: 'Email', fieldLabel: 'Email', fieldType: 'IndividualField', isArray: false, isGroup: true },
                keys: ['value'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Email', fieldLabel: 'Email', isArray: false, isGroup: false } }
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'telecom', fieldName: 'Other Contacts', fieldLabel: 'Other Contacts', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['value', 'system'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Contact', fieldLabel: 'Contact', isArray: false, isGroup: false } },
                    system: <IndividualField>{ generalProperties: { fieldApiName: 'system', fieldName: 'System', fieldLabel: 'System', isArray: false, isGroup: false } }
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'address', fieldName: 'Address', fieldLabel: 'Address', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['line', 'city', 'state', 'postalCode', 'country'],
                groupFields: {
                    line: <IndividualField>{ generalProperties: { fieldApiName: 'line', fieldName: 'Line', fieldLabel: 'Line', isArray: false, isGroup: false } },
                    city: <IndividualField>{ generalProperties: { fieldApiName: 'city', fieldName: 'City', fieldLabel: 'City', isArray: false, isGroup: false } },
                    state: <IndividualField>{ generalProperties: { fieldApiName: 'state', fieldName: 'State', fieldLabel: 'State', isArray: false, isGroup: false } },
                    postalCode: <IndividualField>{ generalProperties: { fieldApiName: 'postalCode', fieldName: 'Postal Code', fieldLabel: 'Postal Code', isArray: false, isGroup: false } },
                    country: <IndividualField>{ generalProperties: { fieldApiName: 'country', fieldName: 'Country', fieldLabel: 'Country', isArray: false, isGroup: false } }
                }
            }
        ];
    }

    mapOrganizationToSubmitted(org: Organization, fields: AnyField[]): any {
        const telecom = org.telecom || [];
        const phone = telecom.filter(t => t.system === 'phone');
        const email = telecom.filter(t => t.system === 'email');
        const other = telecom.filter(t => t.system !== 'phone' && t.system !== 'email');
        return {
            name: org.name || '',
            description: this.getDescriptionExtension(org) || '',
            phone_telecom: phone[0] ? { value: phone[0].value } : { value: '' },
            email_telecom: email[0] ? { value: email[0].value } : { value: '' },
            telecom: other.map(o => ({ value: o.value, system: o.system })),
            address: (org.address || []).map(a => ({ line: a.line?.[0] || '', city: a.city || '', state: a.state || '', postalCode: a.postalCode || '', country: a.country || '' }))
        };
    }

    applySubmittedToOrganization(submitted: any, org: Organization): Organization {
        const out = { ...org };
        out.name = submitted.name || out.name;
        // description extension
        out.extension = (out.extension || []).filter(e => e.url !== 'http://elikita.org/fhir/StructureDefinition/organization-description');
        if (submitted.description) {
            out.extension.push({ url: 'http://elikita.org/fhir/StructureDefinition/organization-description', valueString: submitted.description });
        }
        const telecom: any[] = [];
        if (submitted.phone_telecom?.value) telecom.push({ system: 'phone', value: submitted.phone_telecom.value });
        if (submitted.email_telecom?.value) telecom.push({ system: 'email', value: submitted.email_telecom.value });
        if (Array.isArray(submitted.telecom)) telecom.push(...submitted.telecom.filter((t: any) => t.value).map((t: any) => ({ system: t.system || 'other', value: t.value })));
        out.telecom = telecom.length ? telecom : undefined;
        out.address = Array.isArray(submitted.address) ? submitted.address.map((a: any) => ({
            line: a.line ? [a.line] : undefined,
            city: a.city || undefined,
            state: a.state || undefined,
            postalCode: a.postalCode || undefined,
            country: a.country || undefined,
            text: [a.line, a.city, a.state, a.country, a.postalCode].filter(Boolean).join(', ') || undefined
        })) : undefined;
        return out;
    }

    getDescriptionExtension(org: Organization): string | undefined {
        const ext = (org.extension || []).find(e => e.url === 'http://elikita.org/fhir/StructureDefinition/organization-description');
        return ext && (ext as any).valueString;
    }

    onCancel() {
        // Implement navigation or dialog close logic when integrated
        console.log('[HospitalProfileEdit] Cancel clicked');
    }

    onSave() {
        this.organization = this.applySubmittedToOrganization(this.submittedData, this.organization);
        console.log('[HospitalProfileEdit] Updated Organization:', this.organization);
    }
}
