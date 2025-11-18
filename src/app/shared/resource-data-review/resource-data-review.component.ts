import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../dynamic-forms-v2/dynamic-forms-v2.component';
import { MatDividerModule } from '@angular/material/divider';
import { SplitHashPipe } from "../split-hash.pipe";

/**
 * Generic resource data review component.
 * Reusable for any FHIR resource (or arbitrary object) given form field definitions and submitted-like data.
 * It mirrors the editing workflow of PatientDataReviewComponent but pushes mapping responsibilities outward via callbacks.
 */
@Component({
    selector: 'app-resource-data-review',
    standalone: true,
    imports: [CommonModule, MatCardModule,
        MatDividerModule,
        MatButtonModule, MatIconModule, MatDialogModule, SplitHashPipe],
    templateUrl: './resource-data-review.component.html',
    styleUrls: ['./resource-data-review.component.scss']
})
export class ResourceDataReviewComponent implements OnInit {
    @Input() resource: any; // Original resource object (FHIR Organization, Patient, etc.)
    @Input() formFields: any[] = []; // Dynamic form field definitions
    @Input() submittedData?: any; // Optional pre-mapped submitted data
    @Input() mapResourceToSubmittedData?: (resource: any, formFields: any[]) => any; // Mapping inbound
    @Input() applySubmittedDataToResource?: (submitted: any, resource: any) => any; // Mapping outbound
    @Input() showEditButtons: boolean = true;

    @Output() fieldEdited = new EventEmitter<{ fieldApiName: string; newValue: any; isArray?: boolean; arrayIndex?: number }>();
    @Output() resourceUpdated = new EventEmitter<any>();

    dialog = inject(MatDialog);

    simpleFields: any[] = [];
    arrayFields: any[] = [];
    groupedArrayFields: { [key: string]: any[] } = {};

    ngOnInit() {
        if (!this.submittedData) {
            if (this.mapResourceToSubmittedData) {
                this.submittedData = this.mapResourceToSubmittedData(this.resource, this.formFields) || {};
            } else {
                // Fallback shallow mapping: copy primitive & object references by fieldApiName
                this.submittedData = {};
                this.formFields.forEach(f => {
                    const k = f.generalProperties.fieldApiName;
                    (this.submittedData as any)[k] = (this.resource as any)[k];
                });
            }
        }
        this.categorizeFields();
    }

    private categorizeFields() {
        this.simpleFields = [];
        this.arrayFields = [];
        this.groupedArrayFields = {};
        this.formFields.forEach((field: any) => {
            const apiName = field.generalProperties.fieldApiName;
            if (field.generalProperties.isHidden) return;
            if (field.generalProperties.isArray) {
                const dataArray = this.submittedData[apiName];
                if (!this.groupedArrayFields[apiName]) this.groupedArrayFields[apiName] = [];
                if (Array.isArray(dataArray)) {
                    dataArray.forEach((item: any, index: number) => {
                        const arrayItem = {
                            field,
                            fieldApiName: apiName,
                            fieldLabel: field.generalProperties.fieldLabel || field.generalProperties.fieldName,
                            data: item,
                            index,
                            totalCount: dataArray.length
                        };
                        this.arrayFields.push(arrayItem);
                        this.groupedArrayFields[apiName].push(arrayItem);
                    });
                }
            } else {
                this.simpleFields.push({
                    field,
                    fieldApiName: apiName,
                    fieldLabel: field.generalProperties.fieldLabel || field.generalProperties.fieldName,
                    data: this.submittedData[apiName]
                });
            }
        });
    }

    // Editing workflows
    editSimpleFields() {
        const fieldsWithValues = this.simpleFields.map(sf => {
            const copy = JSON.parse(JSON.stringify(sf.field));
            this.setFieldValue(copy, sf.data);
            copy.generalProperties.isArray = false;
            if (copy.generalProperties.isGroup && copy.groupFields) {
                Object.keys(copy.groupFields).forEach(k => copy.groupFields[k].generalProperties.isArray = false);
            }
            return copy;
        });
        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '800px',
            data: {
                formMetaData: { formName: 'Edit Details', submitText: 'Save Changes', closeDialogOnSubmit: true },
                formFields: fieldsWithValues
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result?.values) {
                Object.keys(result.values).forEach(k => {
                    this.submittedData[k] = result.values[k];
                    this.fieldEdited.emit({ fieldApiName: k, newValue: result.values[k], isArray: false });
                });
                this.applyAndEmit();
                this.categorizeFields();
            }
        });
    }

    addArrayItem(fieldApiName: string) {
        const fieldDef = this.formFields.find(f => f.generalProperties.fieldApiName === fieldApiName);
        if (!fieldDef) return;
        const emptyItem = this.createEmptyArrayItem(fieldDef);
        const fieldCopy = JSON.parse(JSON.stringify(fieldDef));
        fieldCopy.generalProperties.isArray = false;
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            Object.keys(fieldCopy.groupFields).forEach(k => fieldCopy.groupFields[k].generalProperties.isArray = false);
        }
        this.setFieldValue(fieldCopy, emptyItem);
        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '600px',
            data: {
                formMetaData: { formName: `Add ${fieldCopy.generalProperties.fieldLabel || fieldCopy.generalProperties.fieldName}`, submitText: 'Add', closeDialogOnSubmit: true },
                formFields: [fieldCopy]
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result?.values) {
                const newValue = result.values[fieldApiName];
                if (!Array.isArray(this.submittedData[fieldApiName])) this.submittedData[fieldApiName] = [];
                this.submittedData[fieldApiName].push(newValue);
                this.fieldEdited.emit({ fieldApiName, newValue: this.submittedData[fieldApiName], isArray: true });
                this.applyAndEmit();
                this.categorizeFields();
            }
        });
    }

    editArrayItem(arrayFieldInfo: any) {
        const { field, fieldApiName, data, index } = arrayFieldInfo;
        const fieldCopy = JSON.parse(JSON.stringify(field));
        fieldCopy.generalProperties.isArray = false;
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            Object.keys(fieldCopy.groupFields).forEach(k => fieldCopy.groupFields[k].generalProperties.isArray = false);
        }
        this.setFieldValue(fieldCopy, data);
        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '600px',
            data: {
                formMetaData: { formName: `Edit ${field.generalProperties.fieldLabel || field.generalProperties.fieldName} #${index + 1}`, submitText: 'Save Changes', closeDialogOnSubmit: true },
                formFields: [fieldCopy]
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result?.values) {
                const updated = result.values[fieldApiName];
                this.submittedData[fieldApiName][index] = updated;
                this.fieldEdited.emit({ fieldApiName, newValue: updated, isArray: true, arrayIndex: index });
                this.applyAndEmit();
                this.categorizeFields();
            }
        });
    }

    deleteArrayItem(arrayFieldInfo: any) {
        const { fieldApiName, index } = arrayFieldInfo;
        if (!confirm('Delete this entry?')) return;
        this.submittedData[fieldApiName].splice(index, 1);
        this.fieldEdited.emit({ fieldApiName, newValue: this.submittedData[fieldApiName], isArray: true });
        this.applyAndEmit();
        this.categorizeFields();
    }

    private applyAndEmit() {
        if (this.applySubmittedDataToResource) {
            this.resource = this.applySubmittedDataToResource(this.submittedData, this.resource);
        } else {
            // Shallow merge fallback
            Object.keys(this.submittedData).forEach(k => (this.resource as any)[k] = this.submittedData[k]);
        }
        this.resourceUpdated.emit(this.resource);
    }

    private createEmptyArrayItem(fieldDef: any): any {
        if (fieldDef.generalProperties.isGroup && fieldDef.groupFields) {
            const obj: any = {};
            Object.keys(fieldDef.groupFields).forEach(k => {
                const sf = fieldDef.groupFields[k];
                obj[k] = sf.generalProperties.isArray ? [] : '';
            });
            return obj;
        }
        return '';
    }

    private setFieldValue(field: any, value: any) {
        if (field.generalProperties.isGroup && field.groupFields) {
            Object.keys(field.groupFields).forEach(k => {
                if (value && value.hasOwnProperty(k)) field.groupFields[k].generalProperties.value = value[k];
            });
        } else {
            field.generalProperties.value = value;
        }
    }

    // Template helpers
    getGroupedArrayKeys(): string[] { return Object.keys(this.groupedArrayFields); }
    getArrayItemsForField(apiName: string): any[] { return this.groupedArrayFields[apiName] || []; }
    objectKeys(o: any): string[] { return o ? Object.keys(o) : []; }
    isSubfieldHidden(arrayItem: any, key: string): boolean {
        const gf = arrayItem.field?.groupFields?.[key];
        return gf?.generalProperties?.isHidden === true;
    }
    getSubfieldLabel(arrayItem: any, key: string): string {
        const gf = arrayItem.field?.groupFields?.[key];
        return gf?.generalProperties?.fieldLabel || gf?.generalProperties?.fieldName || key;
    }
}
