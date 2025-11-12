import { Injectable, inject } from '@angular/core';
import { CodeableConceptField, CodeField, GroupField, IndividualField } from './dynamic-forms.interface2';
import { FormFieldsSelectDataService } from './form-fields-select-data.service';
import { firstValueFrom } from 'rxjs';

export type FormField = IndividualField | CodeField | CodeableConceptField | GroupField;

export interface BuildOptions {
    mode?: 'edit' | 'registration';
    includeGuardianGender?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FieldConfigFactoryService {
    private selectService = inject(FormFieldsSelectDataService);

    async buildPatientDetailsFields(options: BuildOptions = {}): Promise<FormField[]> {
        const gender = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'gender'));
        const maritalStatus = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'maritalStatus'));
        const contactPointUse = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'contactPointUse'));
        const contactPointSystem = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'contactPointSystem'));

        return [
            <IndividualField>{ generalProperties: { fieldApiName: 'active', fieldName: 'Active', fieldLabel: 'Active', isHidden: true, isArray: false, isGroup: false } },
            <GroupField>{
                generalProperties: { fieldApiName: 'name', fieldName: 'Name', fieldLabel: 'Name', fieldType: 'IndividualField', isArray: false, isGroup: true },
                keys: ['given', 'family', 'title', 'otherNames'],
                groupFields: {
                    title: <IndividualField>{ generalProperties: { fieldApiName: 'title', fieldName: 'Title', fieldLabel: 'Title', isArray: false, isGroup: false } },
                    family: <IndividualField>{ generalProperties: { fieldApiName: 'family', fieldName: 'Last Name / Surname', fieldLabel: 'Last Name / Surname', isArray: false, isGroup: false } },
                    given: <IndividualField>{ generalProperties: { fieldApiName: 'given', fieldName: 'First Name', fieldLabel: 'First Name', isArray: false, isGroup: false } },
                    otherNames: <IndividualField>{ generalProperties: { fieldApiName: 'otherNames', fieldName: 'Other Names', fieldLabel: 'Other Names', isArray: false, isGroup: false } },
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'phone_telecom', fieldName: 'Phone Number', fieldLabel: 'Phone Number', fieldType: 'IndividualField', isArray: true, isGroup: true, hiddenFields: ['system'] },
                keys: ['value', 'use'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Phone Number', fieldLabel: 'Phone Number', isArray: false, isGroup: false } },
                    system: <CodeField>{ generalProperties: { fieldApiName: 'system', fieldName: 'Contact Platform', fieldLabel: 'Contact Platform', fieldType: 'CodeField', value: 'phone', isHidden: true, isArray: false, isGroup: false }, data: contactPointSystem },
                    use: <CodeField>{ generalProperties: { fieldApiName: 'use', fieldName: 'Contact Type', fieldLabel: 'Contact Type', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointUse },
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'email_telecom', fieldName: 'Email', fieldLabel: 'Email', fieldType: 'IndividualField', isArray: true, isGroup: true, hiddenFields: ['system'] },
                keys: ['value', 'use'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Email', fieldLabel: 'Email', isArray: false, isGroup: false } },
                    system: <CodeField>{ generalProperties: { fieldApiName: 'system', fieldName: 'Contact Platform', fieldLabel: 'Contact Platform', fieldType: 'CodeField', value: 'email', isHidden: true, isArray: false, isGroup: false }, data: contactPointSystem },
                    use: <CodeField>{ generalProperties: { fieldApiName: 'use', fieldName: 'Contact Type', fieldLabel: 'Contact Type', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointUse },
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'telecom', fieldName: 'Other Contacts', fieldLabel: 'Other Contacts', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['value', 'system', 'use'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Contact', fieldLabel: 'Contact', isArray: false, isGroup: false } },
                    system: <CodeField>{ generalProperties: { fieldApiName: 'system', fieldName: 'Contact Platform', fieldLabel: 'Contact Platform', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointSystem },
                    use: <CodeField>{ generalProperties: { fieldApiName: 'use', fieldName: 'Contact Type', fieldLabel: 'Contact Type', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointUse },
                }
            },
            <CodeField>{ generalProperties: { fieldApiName: 'gender', fieldName: 'Gender', fieldLabel: 'Gender', fieldType: 'CodeField', isArray: false, isGroup: false }, data: (gender || []).map((x: any) => x[0].toUpperCase() + x.slice(1).toLowerCase()) },
            <IndividualField>{ generalProperties: { fieldApiName: 'birthDate', fieldName: 'Date of Birth', fieldLabel: 'Date of Birth', fieldType: 'IndividualField', inputType: options.mode === 'registration' ? 'datetime-local' : 'date', isArray: false, isGroup: false } },
            <GroupField>{
                generalProperties: { fieldApiName: 'address', fieldName: 'Address', fieldLabel: 'Address', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['line', 'city', 'state', 'country', 'postalCode'],
                groupFields: {
                    line: <IndividualField>{ generalProperties: { fieldApiName: 'line', fieldName: 'Address Line', fieldLabel: 'Address Line', isArray: false, isGroup: false } },
                    city: <IndividualField>{ generalProperties: { fieldApiName: 'city', fieldName: 'City', fieldLabel: 'City', isArray: false, isGroup: false } },
                    state: <IndividualField>{ generalProperties: { fieldApiName: 'state', fieldName: 'State', fieldLabel: 'State', isArray: false, isGroup: false } },
                    country: <IndividualField>{ generalProperties: { fieldApiName: 'country', fieldName: 'Country', fieldLabel: 'Country', isArray: false, isGroup: false } },
                    postalCode: <IndividualField>{ generalProperties: { fieldApiName: 'postalCode', fieldName: 'Postal Code', fieldLabel: 'Postal Code', isArray: false, isGroup: false } },
                }
            },
            <CodeableConceptField>{ generalProperties: { fieldApiName: 'maritalStatus', fieldName: 'Marital Status', fieldLabel: 'Marital Status', fieldType: 'CodeableConceptField', isArray: false, isGroup: false }, data: maritalStatus },
        ];
    }

    async buildGuardianFields(options: BuildOptions = {}): Promise<FormField[]> {
        const relationship = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'relationship'));
        const gender = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'gender'));
        const contactPointUse = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'contactPointUse'));
        const contactPointSystem = await firstValueFrom(this.selectService.getFormFieldSelectData('patient', 'contactPointSystem'));

        const fields: FormField[] = [
            <GroupField>{
                generalProperties: { fieldApiName: 'name', fieldName: 'Guardian Name', fieldLabel: 'Guardian Name', fieldType: 'IndividualField', isArray: false, isGroup: true },
                keys: ['given', 'family', 'title', 'otherNames'],
                groupFields: {
                    title: <IndividualField>{ generalProperties: { fieldApiName: 'title', fieldName: 'Title', fieldLabel: 'Title', isArray: false, isGroup: false } },
                    family: <IndividualField>{ generalProperties: { fieldApiName: 'family', fieldName: 'Last Name / Surname', fieldLabel: 'Last Name / Surname', isArray: false, isGroup: false } },
                    given: <IndividualField>{ generalProperties: { fieldApiName: 'given', fieldName: 'First Name', fieldLabel: 'First Name', isArray: false, isGroup: false } },
                    otherNames: <IndividualField>{ generalProperties: { fieldApiName: 'otherNames', fieldName: 'Other Names', fieldLabel: 'Other Names', isArray: false, isGroup: false } },
                }
            },
            <CodeableConceptField>{ generalProperties: { fieldApiName: 'relationship', fieldName: 'Relationship', fieldLabel: 'Relationship', fieldType: 'CodeableConceptField', isArray: false, isGroup: false }, data: relationship },
            <GroupField>{
                generalProperties: { fieldApiName: 'phone_telecom', fieldName: 'Phone Number', fieldLabel: 'Phone Number', fieldType: 'IndividualField', isArray: true, isGroup: true, hiddenFields: ['system'] },
                keys: ['value', 'use'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Phone Number', fieldLabel: 'Phone Number', isArray: false, isGroup: false } },
                    system: <CodeField>{ generalProperties: { fieldApiName: 'system', fieldName: 'Contact Platform', fieldLabel: 'Contact Platform', fieldType: 'CodeField', value: 'phone', isHidden: true, isArray: false, isGroup: false }, data: contactPointSystem },
                    use: <CodeField>{ generalProperties: { fieldApiName: 'use', fieldName: 'Contact Type', fieldLabel: 'Contact Type', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointUse },
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'email_telecom', fieldName: 'Email', fieldLabel: 'Email', fieldType: 'IndividualField', isArray: true, isGroup: true, hiddenFields: ['system'] },
                keys: ['value', 'use'],
                groupFields: {
                    value: <IndividualField>{ generalProperties: { fieldApiName: 'value', fieldName: 'Email', fieldLabel: 'Email', isArray: false, isGroup: false } },
                    system: <CodeField>{ generalProperties: { fieldApiName: 'system', fieldName: 'Contact Platform', fieldLabel: 'Contact Platform', fieldType: 'CodeField', value: 'email', isHidden: true, isArray: false, isGroup: false }, data: contactPointSystem },
                    use: <CodeField>{ generalProperties: { fieldApiName: 'use', fieldName: 'Contact Type', fieldLabel: 'Contact Type', fieldType: 'CodeField', isArray: false, isGroup: false }, data: contactPointUse },
                }
            },
            <GroupField>{
                generalProperties: { fieldApiName: 'address', fieldName: 'Guardian Address', fieldLabel: 'Guardian Address', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['line', 'city', 'state', 'country', 'postalCode'],
                groupFields: {
                    line: <IndividualField>{ generalProperties: { fieldApiName: 'line', fieldName: 'Address Line', fieldLabel: 'Address Line', isArray: true, isGroup: false } },
                    city: <IndividualField>{ generalProperties: { fieldApiName: 'city', fieldName: 'City', fieldLabel: 'City', isArray: false, isGroup: false } },
                    state: <IndividualField>{ generalProperties: { fieldApiName: 'state', fieldName: 'State', fieldLabel: 'State', isArray: false, isGroup: false } },
                    country: <IndividualField>{ generalProperties: { fieldApiName: 'country', fieldName: 'Country', fieldLabel: 'Country', isArray: false, isGroup: false } },
                    postalCode: <IndividualField>{ generalProperties: { fieldApiName: 'postalCode', fieldName: 'Postal Code', fieldLabel: 'Postal Code', isArray: false, isGroup: false } },
                }
            },
        ];

        if (options.includeGuardianGender) {
            fields.push(<CodeField>{ generalProperties: { fieldApiName: 'gender', fieldName: 'Guardian Gender', fieldLabel: 'Guardian Gender', fieldType: 'CodeField', isArray: false, isGroup: false }, data: gender });
        }

        return fields;
    }

    buildAttachmentFields(): GroupField[] {
        return [
            <GroupField>{
                generalProperties: { fieldApiName: 'photo', fieldName: 'Attachments', fieldLabel: 'Attachments', fieldType: 'IndividualField', isArray: true, isGroup: true },
                keys: ['title', 'url', 'contentType', 'creation'],
                groupFields: {
                    title: <IndividualField>{ generalProperties: { fieldApiName: 'title', fieldName: 'Title', fieldLabel: 'Title', isArray: false, isGroup: false } },
                    url: <IndividualField>{ generalProperties: { fieldApiName: 'url', fieldName: 'URL', fieldLabel: 'URL', isArray: false, isGroup: false } },
                    contentType: <IndividualField>{ generalProperties: { fieldApiName: 'contentType', fieldName: 'Content Type', fieldLabel: 'Content Type', isArray: false, isGroup: false } },
                    creation: <IndividualField>{ generalProperties: { fieldApiName: 'creation', fieldName: 'Created', fieldLabel: 'Created', isArray: false, isGroup: false } },
                }
            }
        ];
    }
}
