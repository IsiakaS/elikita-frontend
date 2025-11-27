import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
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
import { FormControl } from '@angular/forms';
import { Location, Organization } from 'fhir/r4';
import { UtilityService } from '../shared/utility.service';
import { commonImports } from '../shared/table-interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-add-admission-location',
  standalone: true,
  imports: [CommonModule, DynamicFormsV2Component, ...commonImports, MatSlideToggleModule],
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
  locationsAvailable?: Location[] = [];
  loading = true;
  //reactive form to determine whether the address is same as hosptial address
  addressSameAsHospital = new FormControl(false);
  hospitalAddress? : Organization['address'];
  locationResourceToSubmit:Location = {
    //initial structure
    address: {},
    resourceType: 'Location',
    name: '',
    status: 'active',
  }

//partOf-Type formControl
partOfType = new FormControl('');
//PHYSICALtYPE DROPDOWM
setPartOfTypeValue(value: string){
    this.partOfType.setValue(value);
}
@ViewChild('pOT') partOfTypeFormRef!: DynamicFormsV2Component;
// generalLocationForm
@ViewChild('generalLocationForm') generalLocationFormRef!: DynamicFormsV2Component;

ngAfterViewInit(){
    this.partOfTypeFormRef.aForm.get('partOfType')?.valueChanges.subscribe(value => {
        this.setPartOfTypeValue(value);
    });
}
  processingForm(values: any){


//after transforming values

    if(this.addressSameAsHospital.value && this.hospitalAddress){
        this.locationResourceToSubmit.address = this.hospitalAddress[0];
    }else{

    }
  }
utilityService = inject(UtilityService)
filteredLocations?: Location[] 

  ngOnInit(): void {
    forkJoin({
    //   status: this.selectDataService.getFormFieldSelectData('location', 'status'),
      physicalType: this.selectDataService.getFormFieldSelectData('location', 'physicalType'),
      partOf: this.selectDataService.getFormFieldSelectData('location', 'partOf'),
      location: this.utilityService.getResourceData('Location'),
       }).subscribe({
      next: (resolved) => {
        this.locationsAvailable = resolved.location as Location[];
        this.filteredLocations = this.locationsAvailable;
        this.formFields = this.buildLocationFormFields( resolved.physicalType, resolved.partOf);
        this.loading = false;
      },
      error: () => {
        this.errorService.openandCloseError('Unable to load admission-location field options.');
        this.loading = false;
      }
    });

    this.addressSameAsHospital.valueChanges.subscribe(value => {
        if(value){
            // alert('Address is the same as hospital address');
            this.generalLocationFormRef.formFields = [...this.generalLocationFormRef.formFields.splice(this.generalLocationFormRef.formFields.findIndex(f => f.generalProperties.fieldApiName === 'address'),
            
            this.generalLocationFormRef.formFields.findIndex(f => f.generalProperties.fieldApiName === 'address')>-1?1:0)];
        } else {
            console.log('Adding address field back', this.formFields);


//   this.generalLocationFormRef.formFields.splice(2,0,this.formFields.find(f => f.generalProperties.fieldApiName === 'address'))


            // );
            // this.generalLocationFormRef.formFields.splice(2,0,this.formFields.find(f => f.generalProperties.fieldApiName === 'address')!);

        }});

    this.partOfType.valueChanges.subscribe((value: string | null) => {
  if (value && this.locationsAvailable) {
    this.filteredLocations = this.utilityService.filterResourceByACodeableConceptfield(this.locationsAvailable, 'physicalType', value) as Location[];
    } else {
    this.filteredLocations = this.locationsAvailable;
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
