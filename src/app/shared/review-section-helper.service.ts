import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReviewSectionHelperService {
    categorizeFields(formFields: any[], submittedData: any) {
        const simpleFields: any[] = [];
        const arrayFields: any[] = [];
        const groupedArrayFields: { [key: string]: any[] } = {};

        if (!Array.isArray(formFields)) {
            return { simpleFields, arrayFields, groupedArrayFields };
        }

        formFields.forEach((field: any) => {
            const apiName = field.generalProperties?.fieldApiName;
            if (!apiName) return;

            if (field.generalProperties.isHidden === true) return;

            if (field.generalProperties.isArray) {
                const dataArray = submittedData?.[apiName];
                if (!groupedArrayFields[apiName]) groupedArrayFields[apiName] = [];

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
                        arrayFields.push(arrayItem);
                        groupedArrayFields[apiName].push(arrayItem);
                    });
                }
            } else {
                simpleFields.push({
                    field,
                    fieldApiName: apiName,
                    fieldLabel: field.generalProperties.fieldLabel || field.generalProperties.fieldName,
                    data: submittedData?.[apiName]
                });
            }
        });

        return { simpleFields, arrayFields, groupedArrayFields };
    }

    createEmptyArrayItem(fieldDef: any): any {
        if (fieldDef?.generalProperties?.isGroup && fieldDef.groupFields) {
            const emptyItem: any = {};
            for (const key in fieldDef.groupFields) {
                const subField = fieldDef.groupFields[key];
                emptyItem[key] = subField.generalProperties?.isArray ? [] : '';
            }
            return emptyItem;
        }
        return '';
    }

    applyFieldCustomizations(field: any) {
        if (!field?.generalProperties?.isGroup || !field.groupFields) return;

        if (Array.isArray(field.generalProperties.hiddenFields)) {
            field.generalProperties.hiddenFields.forEach((hidden: string) => {
                if (field.groupFields[hidden]?.generalProperties) {
                    field.groupFields[hidden].generalProperties.isHidden = true;
                }
            });
        }

        const replace = field.generalProperties.nameReplace;
        if (replace && typeof replace === 'object') {
            Object.keys(replace).forEach((k) => {
                if (field.groupFields[k]?.generalProperties) {
                    field.groupFields[k].generalProperties.fieldLabel = replace[k];
                    field.groupFields[k].generalProperties.fieldName = replace[k];
                }
            });
        }
    }

    setFieldValue(field: any, value: any) {
        if (field?.generalProperties?.isGroup && field.groupFields) {
            for (const key in field.groupFields) {
                if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                    field.groupFields[key].generalProperties.value = value[key];
                }
            }
        } else if (field?.generalProperties) {
            field.generalProperties.value = value;
        }
    }
}
