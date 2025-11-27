import { Injectable } from '@angular/core';
import {
    FormFields,
    IndividualField,
    ReferenceFieldArray,
    CodeableConceptField,
    CodeField,
    IndividualReferenceField,
    GroupField
} from '../shared/dynamic-forms.interface2';

@Injectable({ providedIn: 'root' })
export class MedicationDispenseFieldFilterService {
    filterFormFields(fields: FormFields[], allowedFieldApiNames: string[]): FormFields[] {
        if (!fields || !allowedFieldApiNames?.length) {
            return [];
        }
        const allowedSet = new Set(allowedFieldApiNames);
        return fields.filter((field) => allowedSet.has(field.generalProperties.fieldApiName));
    }

    removeFormFields(fields: FormFields[], excludedFieldApiNames: string[]): FormFields[] {
        if (!fields || !excludedFieldApiNames?.length) {
            return fields;
        }
        const excludedSet = new Set(excludedFieldApiNames);
        for (let i = fields.length - 1; i >= 0; i--) {
            if (excludedSet.has(fields[i].generalProperties.fieldApiName)) {
                fields.splice(i, 1);
            }
        }
        return fields;
    }
}
