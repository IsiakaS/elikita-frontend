import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import {
  CodeableConceptField,
  FormFields,
  GroupField,
  IndividualField,
  IndividualReferenceField,
  SingleCodeField,
  formMetaData
} from '../shared/dynamic-forms.interface2';

@Component({
  selector: 'app-add-admission-location',
  standalone: true,
  imports: [CommonModule, DynamicFormsV2Component],
  templateUrl: './add-admission-location.component.html',
  styles: [`
    .add-admission-location { padding: 1rem; }
  `]
})
export class AddAdmissionLocationComponent {
  private readonly selectDataService = inject(FormFieldsSelectDataService);
  private readonly errorService = inject(ErrorService);

  formMetaData: formMetaData = {
    formName: 'Admission Location',
    formDescription: 'Define an admission location that can be reused across wards/rooms/beds.',
    submitText: 'Save Location'
  };

  formFields: FormFields[] = [];
  loading = true;

  ngOnInit(): void {
    forkJoin({
    //   status: this.selectDataService.getFormFieldSelectData('location', 'status'),
      physicalType: this.selectDataService.getFormFieldSelectData('location', 'physicalType'),
      partOf: this.selectDataService.getFormFieldSelectData('location', 'partOf')
    }).subscribe({
      next: (resolved) => {
        this.formFields = this.buildLocationFormFields( resolved.physicalType, resolved.partOf);
        this.loading = false;
      },
      error: () => {
        this.errorService.openandCloseError('Unable to load admission-location field options.');
        this.loading = false;
      }
    });
  }

  private buildLocationFormFields(
    // statusOptions: string[],
    physicalTypeConcept: string[] | {code: string, display: string, system?: string}[],
    partOfReferences: any[]
  ): FormFields[] {
    return [
      <IndividualField>{
        generalProperties: {
          fieldApiName: 'name',
          fieldName: 'Location Name',
          fieldLabel: 'Location Name',
          fieldType: 'IndividualField',
          inputType: 'text',
          validations: [{ type: 'default', name: 'required' }],
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: false
        },
        data: ''
      },
      <SingleCodeField>{
        generalProperties: {
          fieldApiName: 'status',
          fieldName: 'Operational Status',
          fieldLabel: 'Operational Status',
          fieldType: 'SingleCodeField',
          inputType: 'text',
          validations: [{ type: 'default', name: 'required' }],
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: false,
          value: 'active'
        },
        data: "active | suspended | inactive".split(' | ').map(s => s.trim())
      },
      <CodeableConceptField>{
        generalProperties: {
          fieldApiName: 'physicalType',
          fieldName: 'Physical Type',
          fieldLabel: 'Physical Type',
          fieldType: 'CodeableConceptField',
          allowedOthers: true,
          validations: [{ type: 'default', name: 'required', isFunction: false}],
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: false,
          
        },
        data: physicalTypeConcept
      },
      <GroupField>{
        generalProperties: {
          fieldApiName: 'address',
          fieldName: 'Address',
          fieldLabel: 'Address',
          fieldType: 'IndividualField',
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: true
        },
        keys: ['line', 'city', 'state', 'country', 'postalCode'],
        groupFields: {
          line: <IndividualField>{
            generalProperties: {
              fieldApiName: 'line',
              fieldName: 'Address Line',
              fieldLabel: 'Address Line',
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: true,
              isGroup: false
            },
            data: ''
          },
          city: <IndividualField>{
            generalProperties: {
              fieldApiName: 'city',
              fieldName: 'City',
              fieldLabel: 'City',
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false
            },
            data: ''
          },
          state: <IndividualField>{
            generalProperties: {
              fieldApiName: 'state',
              fieldName: 'State/Province',
              fieldLabel: 'State/Province',
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false
            },
            data: ''
          },
          country: <IndividualField>{
            generalProperties: {
              fieldApiName: 'country',
              fieldName: 'Country',
              fieldLabel: 'Country',
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false
            },
            data: ''
          },
          postalCode: <IndividualField>{
            generalProperties: {
              fieldApiName: 'postalCode',
              fieldName: 'Postal Code',
              fieldLabel: 'Postal Code',
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false
            },
            data: ''
          }
        }
      },
      <IndividualReferenceField>{
        generalProperties: {
          fieldApiName: 'partOf',
          fieldName: 'Parent Location',
          fieldLabel: 'Parent Location',
          fieldType: 'IndividualReferenceField',
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: false
        },
        data: partOfReferences
      }
    ];
  }
}
