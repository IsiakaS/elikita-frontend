import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../dynamic-forms-v2/dynamic-forms-v2.component';
import { FormatDisplayValuePipe } from './format-display-value.pipe';

export interface PatientDataReviewConfig {
    formFields: any[];
    submittedData: any;
    showEditButtons?: boolean;
    mode?: 'standalone' | 'dialog';
}

export interface FieldEditEvent {
    fieldApiName: string;
    newValue: any;
    isArray?: boolean;
    arrayIndex?: number;
}

@Component({
    selector: 'app-patient-data-review',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, FormatDisplayValuePipe],
    templateUrl: './patient-data-review.component.html',
    styleUrls: ['./patient-data-review.component.scss']
})
export class PatientDataReviewComponent implements OnInit {
    // Inputs for standalone mode
    @Input() formFields: any[] = [];
    @Input() submittedData: any = {};
    @Input() showEditButtons: boolean = true;
    @Input() mode: 'standalone' | 'dialog' = 'standalone';

    // Outputs for standalone mode (real-time updates)
    @Output() fieldEdited = new EventEmitter<FieldEditEvent>();
    @Output() navigateNext = new EventEmitter<void>();
    @Output() navigatePrev = new EventEmitter<void>();

    // Dialog mode - inject dialog data
    dialogData = inject(MAT_DIALOG_DATA, { optional: true });
    dialogRef = inject(MatDialogRef<PatientDataReviewComponent>, { optional: true });
    dialog = inject(MatDialog);

    // Categorized fields for display
    simpleFields: any[] = [];
    arrayFields: any[] = [];
    groupedArrayFields: { [key: string]: any[] } = {}; // Grouped by fieldApiName

    ngOnInit() {
        const isDialogPayload = !!this.dialogRef && !!this.dialogData && (
            Array.isArray((this.dialogData as any).formFields) || (this.dialogData as any).submittedData !== undefined
        );
        if (isDialogPayload) {
            this.formFields = (this.dialogData as any).formFields || [];
            this.submittedData = (this.dialogData as any).submittedData || {};
            this.showEditButtons = (this.dialogData as any).showEditButtons ?? true;
            this.mode = 'dialog';
        }
        this.categorizeFields();
    }

    /**
     * Categorize fields into simple (non-array) and array fields
     */
    categorizeFields() {
        if (!this.formFields) {
            return;
        }
        this.simpleFields = [];
        this.arrayFields = [];
        this.groupedArrayFields = {};

        this.formFields.forEach((field: any) => {
            const apiName = field.generalProperties.fieldApiName;

            // Skip fields marked as hidden
            if (field.generalProperties.isHidden === true) {
                return;
            }

            if (field.generalProperties.isArray) {
                // Array field - each item will have its own edit button
                const dataArray = this.submittedData[apiName];

                if (!this.groupedArrayFields[apiName]) {
                    this.groupedArrayFields[apiName] = [];
                }

                if (Array.isArray(dataArray)) {
                    dataArray.forEach((item: any, index: number) => {
                        const arrayItem = {
                            field: field,
                            fieldApiName: apiName,
                            fieldLabel: field.generalProperties.fieldLabel || field.generalProperties.fieldName,
                            data: item,
                            index: index,
                            totalCount: dataArray.length
                        };

                        this.arrayFields.push(arrayItem);
                        this.groupedArrayFields[apiName].push(arrayItem);
                    });
                } else {
                    // Empty array - still create a group entry
                    this.groupedArrayFields[apiName] = [];
                }
            } else {
                // Simple field (including group fields that are not arrays)
                this.simpleFields.push({
                    field: field,
                    fieldApiName: apiName,
                    fieldLabel: field.generalProperties.fieldLabel || field.generalProperties.fieldName,
                    data: this.submittedData[apiName]
                });
            }
        });
    }

    /**
     * Add a new item to an array field
     */
    addArrayItem(fieldApiName: string) {
        // Find the field definition
        const fieldDef = this.formFields.find(f => f.generalProperties.fieldApiName === fieldApiName);
        if (!fieldDef) return;

        // Create empty item structure based on field definition
        const emptyItem = this.createEmptyArrayItem(fieldDef);

        // Open dialog to fill in the new item
        const fieldCopy = JSON.parse(JSON.stringify(fieldDef));
        fieldCopy.generalProperties.isArray = false;

        // IMPORTANT: Also set isArray to false for all subfields if it's a group
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            Object.keys(fieldCopy.groupFields).forEach(key => {
                if (fieldCopy.groupFields[key].generalProperties) {
                    fieldCopy.groupFields[key].generalProperties.isArray = false;
                }
            });
        }

        // Apply hidden fields and nameReplace if specified
        this.applyFieldCustomizations(fieldCopy);

        // Log to verify data property is preserved
        console.log('🔍 Field copy with data:', fieldCopy);
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            console.log('📦 GroupFields:', fieldCopy.groupFields);
            Object.keys(fieldCopy.groupFields).forEach(key => {
                const subfield = fieldCopy.groupFields[key];
                console.log(`  - ${key}:`, {
                    fieldType: subfield.generalProperties.fieldType,
                    fieldApiName: subfield.generalProperties.fieldApiName,
                    isArray: subfield.generalProperties.isArray,
                    hasData: !!subfield.data,
                    dataLength: subfield.data?.length,
                    dataSample: subfield.data?.slice(0, 2), // First 2 items
                    fullSubfield: subfield
                });
            });
        }

        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '600px',
            data: {
                formMetaData: {
                    formName: `Add New ${fieldDef.generalProperties.fieldLabel || fieldDef.generalProperties.fieldName}`,
                    formDescription: `Add a new ${(fieldDef.generalProperties.fieldLabel || fieldDef.generalProperties.fieldName).toLowerCase()} entry`,
                    submitText: 'Add',
                    closeDialogOnSubmit: true
                },
                formFields: [fieldCopy]
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.values) {
                const newValue = result.values[fieldApiName];

                // Initialize array if it doesn't exist
                if (!this.submittedData[fieldApiName]) {
                    this.submittedData[fieldApiName] = [];
                }

                // Add the new item
                this.submittedData[fieldApiName].push(newValue);

                console.log(`✅ New item added to ${fieldApiName}:`, newValue);

                // Emit field edit in standalone mode
                if (this.mode === 'standalone') {
                    this.fieldEdited.emit({
                        fieldApiName: fieldApiName,
                        newValue: this.submittedData[fieldApiName],
                        isArray: true
                    });
                }

                // Re-categorize to update display
                this.categorizeFields();

                // If in dialog mode, close and return all data
                if (this.mode === 'dialog' && this.dialogRef) {
                    this.dialogRef.close({
                        submittedData: this.submittedData,
                        action: 'edited'
                    });
                }
            }
        });
    }

    /**
     * Delete an item from an array field
     */
    deleteArrayItem(arrayFieldInfo: any) {
        const { fieldApiName, index } = arrayFieldInfo;

        // Confirm deletion
        if (!confirm(`Are you sure you want to delete this ${arrayFieldInfo.fieldLabel}?`)) {
            return;
        }

        // Remove the item from the array
        this.submittedData[fieldApiName].splice(index, 1);

        console.log(`🗑️ Item deleted from ${fieldApiName} at index ${index}`);

        // Emit field edit in standalone mode
        if (this.mode === 'standalone') {
            this.fieldEdited.emit({
                fieldApiName: fieldApiName,
                newValue: this.submittedData[fieldApiName],
                isArray: true
            });
        }

        // Re-categorize to update display
        this.categorizeFields();

        // If in dialog mode, close and return all data
        if (this.mode === 'dialog' && this.dialogRef) {
            this.dialogRef.close({
                submittedData: this.submittedData,
                action: 'edited'
            });
        }
    }

    /**
     * Create an empty item structure for an array field
     */
    private createEmptyArrayItem(fieldDef: any): any {
        if (fieldDef.generalProperties.isGroup && fieldDef.groupFields) {
            // Group field - create object with empty values for each subfield
            const emptyItem: any = {};
            for (const key in fieldDef.groupFields) {
                const subField = fieldDef.groupFields[key];
                if (subField.generalProperties.isArray) {
                    emptyItem[key] = [];
                } else {
                    emptyItem[key] = '';
                }
            }
            return emptyItem;
        } else {
            // Simple field
            return '';
        }
    }

    /**
     * Get object keys for a grouped array field
     */
    getGroupedArrayKeys(): string[] {
        return Object.keys(this.groupedArrayFields);
    }

    /**
     * Get array items for a specific field
     */
    getArrayItemsForField(fieldApiName: string): any[] {
        return this.groupedArrayFields[fieldApiName] || [];
    }

    /**
     * Get field definition for an array field
     */
    getFieldDefinition(fieldApiName: string): any {
        return this.formFields.find(f => f.generalProperties.fieldApiName === fieldApiName);
    }

    /**
     * Edit simple/non-array fields together in one dialog
     */
    editSimpleFields() {
        const simpleFieldsConfig = this.simpleFields.map(sf => sf.field);
        const simpleFieldsData = this.simpleFields.reduce((acc: any, sf: any) => {
            acc[sf.fieldApiName] = sf.data;
            return acc;
        }, {});

        // Create form fields with pre-filled values
        const fieldsWithValues = simpleFieldsConfig.map((field: any) => {
            const fieldCopy = JSON.parse(JSON.stringify(field));
            this.setFieldValue(fieldCopy, simpleFieldsData[fieldCopy.generalProperties.fieldApiName]);
            return fieldCopy;
        });

        // Log to verify data property is preserved
        console.log('🔍 Edit simple fields - Fields with data:', fieldsWithValues);

        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '800px',
            data: {
                formMetaData: {
                    formName: 'Edit Patient Details',
                    formDescription: 'Update your information',
                    submitText: 'Save Changes',
                    closeDialogOnSubmit: true
                },
                formFields: fieldsWithValues
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.values) {
                console.log('✏️ Simple fields updated:', result.values);

                // Update submitted data with new values
                Object.keys(result.values).forEach(key => {
                    this.submittedData[key] = result.values[key];

                    // Emit individual field edits in standalone mode
                    if (this.mode === 'standalone') {
                        this.fieldEdited.emit({
                            fieldApiName: key,
                            newValue: result.values[key],
                            isArray: false
                        });
                    }
                });

                // Re-categorize to update display
                this.categorizeFields();

                // If in dialog mode, close and return all data
                if (this.mode === 'dialog' && this.dialogRef) {
                    this.dialogRef.close({
                        submittedData: this.submittedData,
                        action: 'edited'
                    });
                }
            }
        });
    }

    /**
     * Edit a single item from an array field
     */
    editArrayItem(arrayFieldInfo: any) {
        const { field, fieldApiName, data, index } = arrayFieldInfo;

        // Create a single field configuration with the item's data
        const fieldCopy = JSON.parse(JSON.stringify(field));

        // For array fields, we need to edit as a single instance (not array)
        fieldCopy.generalProperties.isArray = false;

        // IMPORTANT: Also set isArray to false for all subfields if it's a group
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            Object.keys(fieldCopy.groupFields).forEach(key => {
                if (fieldCopy.groupFields[key].generalProperties) {
                    fieldCopy.groupFields[key].generalProperties.isArray = false;
                }
            });
        }

        // Apply hidden fields and nameReplace if specified
        this.applyFieldCustomizations(fieldCopy);

        this.setFieldValue(fieldCopy, data);

        // Log to verify data property is preserved
        console.log('🔍 Edit array item - Field copy with data:', fieldCopy);
        if (fieldCopy.generalProperties.isGroup && fieldCopy.groupFields) {
            console.log('📦 GroupFields:', fieldCopy.groupFields);
            Object.keys(fieldCopy.groupFields).forEach(key => {
                const subfield = fieldCopy.groupFields[key];
                console.log(`  - ${key}:`, {
                    fieldType: subfield.generalProperties?.fieldType,
                    fieldApiName: subfield.generalProperties?.fieldApiName,
                    isArray: subfield.generalProperties?.isArray,
                    hasData: !!subfield.data,
                    dataLength: subfield.data?.length,
                    dataSample: subfield.data?.slice(0, 2), // First 2 items
                    fullSubfield: subfield
                });
            });
        }

        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            width: '600px',
            data: {
                formMetaData: {
                    formName: `Edit ${field.generalProperties.fieldLabel || field.generalProperties.fieldName} #${index + 1}`,
                    formDescription: `Update item ${index + 1} of ${arrayFieldInfo.totalCount}`,
                    submitText: 'Save Changes',
                    closeDialogOnSubmit: true
                },
                formFields: [fieldCopy]
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.values) {
                console.log(`✏️ Array item updated at index ${index}:`, result.values);

                // Update the specific array item
                const updatedValue = result.values[fieldApiName];
                this.submittedData[fieldApiName][index] = updatedValue;

                // Emit field edit in standalone mode
                if (this.mode === 'standalone') {
                    this.fieldEdited.emit({
                        fieldApiName: fieldApiName,
                        newValue: updatedValue,
                        isArray: true,
                        arrayIndex: index
                    });
                }

                // Re-categorize to update display
                this.categorizeFields();

                // If in dialog mode, close and return all data
                if (this.mode === 'dialog' && this.dialogRef) {
                    this.dialogRef.close({
                        submittedData: this.submittedData,
                        action: 'edited'
                    });
                }
            }
        });
    }

    /**
     * Set value on a field (handles nested group fields)
     */
    private setFieldValue(field: any, value: any) {
        if (field.generalProperties.isGroup && field.groupFields) {
            // Group field - set values for nested fields
            for (const key in field.groupFields) {
                if (value && value.hasOwnProperty(key)) {
                    field.groupFields[key].generalProperties.value = value[key];
                }
            }
        } else {
            // Simple field
            field.generalProperties.value = value;
        }
    }

    /**
     * Format field value for display
     */
    formatFieldValue(field: any, data: any): string {
        const apiName = field.fieldApiName;

        // Handle birthDate
        if (apiName === 'birthDate' && data) {
            const date = new Date(data);
            return date.toLocaleDateString();
        }

        // Handle group fields like 'name'
        if (field.field.generalProperties.isGroup && data) {
            if (apiName === 'name') {
                const title = data.title || '';
                const given = data.given || '';
                const otherNames = data.otherNames || '';
                const family = data.family || '';
                return `${title} ${given} ${otherNames} ${family}`.trim().replace(/\s+/g, ' ');
            }
            return JSON.stringify(data);
        }

        // Handle simple fields - pipe will handle $#$ format
        return data ? String(data) : '';
    }

    /**
     * Helper method for template - get object keys
     */
    objectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }

    /**
     * Helper method for template - check if value is array
     */
    isArray(value: any): boolean {
        return Array.isArray(value);
    }

    /**
     * Get subfield label from grouped field definition
     * Returns fieldLabel (or fieldName as fallback) for the given subfield key
     */
    getSubfieldLabel(arrayItem: any, subfieldKey: string): string {
        if (arrayItem.field &&
            arrayItem.field.generalProperties.isGroup &&
            arrayItem.field.groupFields &&
            arrayItem.field.groupFields[subfieldKey]) {
            const subfield = arrayItem.field.groupFields[subfieldKey];
            return subfield.generalProperties.fieldLabel ||
                subfield.generalProperties.fieldName ||
                subfieldKey;
        }
        return subfieldKey;
    }

    /**
     * Check if a subfield should be hidden
     */
    isSubfieldHidden(arrayItem: any, subfieldKey: string): boolean {
        if (arrayItem.field &&
            arrayItem.field.generalProperties.isGroup &&
            arrayItem.field.groupFields &&
            arrayItem.field.groupFields[subfieldKey]) {
            const subfield = arrayItem.field.groupFields[subfieldKey];
            return subfield.generalProperties.isHidden === true;
        }
        return false;
    }

    /**
     * Apply field customizations like hidden fields and nameReplace
     * This processes group fields to hide specified fields and rename labels
     */
    private applyFieldCustomizations(field: any) {
        if (!field.generalProperties.isGroup || !field.groupFields) return;

        // Check for hidden fields configuration
        if (field.generalProperties.hiddenFields && Array.isArray(field.generalProperties.hiddenFields)) {
            field.generalProperties.hiddenFields.forEach((hiddenFieldName: string) => {
                if (field.groupFields[hiddenFieldName]) {
                    field.groupFields[hiddenFieldName].generalProperties.isHidden = true;
                }
            });
        }

        // Check for nameReplace configuration
        if (field.generalProperties.nameReplace && typeof field.generalProperties.nameReplace === 'object') {
            Object.keys(field.generalProperties.nameReplace).forEach((fieldKey: string) => {
                if (field.groupFields[fieldKey]) {
                    const newLabel = field.generalProperties.nameReplace[fieldKey];
                    field.groupFields[fieldKey].generalProperties.fieldLabel = newLabel;
                    field.groupFields[fieldKey].generalProperties.fieldName = newLabel;
                }
            });
        }
    }

    /**
     * Handle navigate to next action
     */
    onNavigateNext() {
        if (this.mode === 'standalone') {
            this.navigateNext.emit();
        } else if (this.mode === 'dialog' && this.dialogRef) {
            this.dialogRef.close({
                submittedData: this.submittedData,
                action: 'next'
            });
        }
    }

    /**
     * Handle navigate to previous action
     */
    onNavigatePrev() {
        if (this.mode === 'standalone') {
            this.navigatePrev.emit();
        } else if (this.mode === 'dialog' && this.dialogRef) {
            this.dialogRef.close({
                submittedData: this.submittedData,
                action: 'prev'
            });
        }
    }

    /**
     * Close dialog without changes
     */
    closeDialog() {
        if (this.dialogRef) {
            this.dialogRef.close({
                action: 'cancel'
            });
        }
    }
}
