import { CommonModule } from '@angular/common';
import { Component, inject, Optional, Inject, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { forkJoin, map, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResourceDataReviewComponent } from '../../shared/resource-data-review/resource-data-review.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { backendEndPointToken } from '../../app.config';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-add-lab-requests',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatOptionModule, DynamicFormsV2Component, ReactiveFormsModule, MatIconModule,
    MatButtonModule, ResourceDataReviewComponent, MatAutocompleteModule, MatInputModule, MatDividerModule
  ],
  templateUrl: './add-lab-requests.component.html',
  styleUrl: './add-lab-requests.component.scss'
})
export class AddLabRequestsComponent {
  //constructor with optional mat dialog
  http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private backendUrl = inject(backendEndPointToken);

  // New form for category and service request code selection
  categoryForm = this.fb.group({
    category: ['', Validators.required],
    serviceRequestCode: ['', Validators.required]
  });

  // Autocomplete options
  categoryOptions: any[] = [];
  serviceRequestOptions: any[] = [];
  filteredCategoryOptions: any[] = [];
  filteredServiceRequestOptions: any[] = [];

  // Loading states
  loadingCategories = false;
  loadingServiceRequests = false;

  // Root form with a form array that mirrors fields in this.formFields
  requestForm: FormGroup = this.fb.group({
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.requestForm.get('items') as FormArray;
  }

  // Builds one form group whose controls match this.formFields by fieldApiName
  private buildItemGroup(overrideValues?: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    (this.formFields || []).forEach(f => {
      const apiName = f.generalProperties.fieldApiName;
      let initial: any;
      if (overrideValues && Object.prototype.hasOwnProperty.call(overrideValues, apiName)) {
        initial = overrideValues[apiName]; // highest precedence
      } else if ('value' in f.generalProperties) {
        initial = (f as any).generalProperties.value;
      } else {
        initial = null;
      }
      controls[apiName] = new FormControl(initial);
    });
    return this.fb.group(controls);
  }

  // Sync single field edits from ResourceDataReviewComponent
  onFieldEdited(index: number, evt: { fieldApiName: string; newValue: any; isArray?: boolean; arrayIndex?: number }) {
    const group = this.items.at(index) as FormGroup;
    if (!group) return;
    group.patchValue({ [evt.fieldApiName]: evt.newValue });
  }

  // Sync full resource object updates
  onResourceUpdated(index: number, updated: any) {
    const group = this.items.at(index) as FormGroup;
    if (!group) return;
    group.patchValue(updated);
  }

  constructor(@Optional() public dialogRef: MatDialogRef<AddLabRequestsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // alert(JSON.stringify(data));
  }
  submittedValues: any;




  isChosenOption = false;
  isMultiple = new FormControl(null);
  formMetaData?: formMetaData;
  formFields?: FormFields[];
  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService);
  medicineForms: { formFields: FormFields[], formMetaData: formMetaData }[] = [

  ]

  ngOnInit() {
    // Setup category search with debouncing
    this.categoryForm.get('category')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string' && value.trim()) {
        this.searchCategory(value);
      } else if (value && typeof value === 'object') {
        // Category has been selected - update code options based on category
        this.onCategorySelected(value);
      }
    });

    // Setup service request code search with debouncing
    this.categoryForm.get('serviceRequestCode')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string' && value.trim()) {
        this.searchServiceRequestCode(value);
      } else if (value && typeof value === 'object') {
        // Service request code has been selected
        this.onServiceRequestCodeSelected(value);
      }
    });

    // Always load the dynamic form fields
    this.loadDynamicFormFields();
  }

  /**
   * Called when category is selected from autocomplete
   */
  onCategorySelected(category: any): void {
    console.log('Category selected:', category);
    // Future: Update code options based on selected category
    // For now, just log it
    // You can implement category-specific code filtering here later
  }

  /**
   * Called when service request code is selected from autocomplete
   */
  onServiceRequestCodeSelected(code: any): void {
    console.log('Service request code selected:', code);
    // Set the code value in the dynamic form if code field exists
    if (this.formFields) {
      const codeField = this.formFields.find(f => f.generalProperties.fieldApiName === 'code');
      if (codeField) {
        // Update the code field value with the selected code
        codeField.generalProperties.value = `${code.code}$#$${code.display}$#$${code.system}`;
      }
    }
  }

  /**
   * Search for service request categories from backend
   */
  searchCategory(searchTerm: string): void {
    this.loadingCategories = true;
    const searchUrl = `${this.backendUrl}/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/servicerequest-category&filter=${encodeURIComponent(searchTerm)}`;

    this.http.get(searchUrl).pipe(
      map((data: any) => {
        if (data?.expansion?.contains) {
          return data.expansion.contains.map((item: any) => ({
            code: item.code,
            display: item.display,
            system: item.system
          }));
        }
        return [];
      })
    ).subscribe({
      next: (options) => {
        this.categoryOptions = options;
        this.filteredCategoryOptions = options;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error searching categories:', err);
        this.loadingCategories = false;
        this.errorService.openandCloseError('Failed to search categories');
      }
    });
  }

  /**
   * Search for service request codes from backend
   */
  searchServiceRequestCode(searchTerm: string): void {
    this.loadingServiceRequests = true;
    const searchUrl = `${this.backendUrl}/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/procedure-code&filter=${encodeURIComponent(searchTerm)}`;

    this.http.get(searchUrl).pipe(
      map((data: any) => {
        if (data?.expansion?.contains) {
          return data.expansion.contains.map((item: any) => ({
            code: item.code,
            display: item.display,
            system: item.system
          }));
        }
        return [];
      })
    ).subscribe({
      next: (options) => {
        this.serviceRequestOptions = options;
        this.filteredServiceRequestOptions = options;
        this.loadingServiceRequests = false;
      },
      error: (err) => {
        console.error('Error searching service request codes:', err);
        this.loadingServiceRequests = false;
        this.errorService.openandCloseError('Failed to search service request codes');
      }
    });
  }

  /**
   * Display function for autocomplete
   */
  displayOption(option: any): string {
    return option?.display || '';
  }

  /**
   * Load dynamic form fields (original ngOnInit logic)
   */
  private loadDynamicFormFields(): void {
    this.formMetaData = <formMetaData>{
      // formName: 'Service Request (Lab Tests, e.t.c.)',
      // formDescription: "Use this form to order a lab test or any other medical services from your or other department",
      // submitText: 'Submit Request',

      formName: this.data && this.data.typeOfService ? `${this.data.typeOfService} Service Request` : 'Service Request (Lab Tests, e.t.c.)',
      formDescription: "Use this form to order a " + (this.data.typeOfService ? this.data.typeOfService : "lab test or any other") + " medical services from your department or others",
      submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
        ? 'Add' : 'Submit'} ${this.data && this.data.typeOfService ? this.data.typeOfService : ""} Request`,

    };
    this.isMultiple.valueChanges.subscribe((e: boolean | null) => {
      if (e !== null) {
        this.isChosenOption = true;
      }
      this.formMetaData = <formMetaData>{
        // formName: 'Service Request (Lab Tests, e.t.c.)',
        // formDescription: "Use this form to order a lab test or anyHere in the Earth Service.  other medical services from your or other department",
        // submitText: 'Submit Request',

        formName: this.data && this.data.typeOfService ? `${this.data.typeOfService} Service Request` : 'Service Request (Lab Tests, e.t.c.)',
        formDescription: "Use this form to order a " + (this.data.typeOfService ? this.data.typeOfService : "lab test or any other") + " medical services from your department or others",
        submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
          ? 'Add' : 'Submit'} ${this.data && this.data.typeOfService ? this.data.typeOfService : ""} Request`,

      }
    })





    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'status'),
      intent: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'intent'),
      code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        // Build formFields array - conditionally include code field based on typeOfService
        const fieldsArray: FormFields[] = [
          {

            generalProperties: {

              fieldApiName: 'status',
              fieldName: 'Status of Request',
              fieldLabel: 'Status of Request',
              value: 'active',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: "draft | active | on-hold | revoked | completed | entered-in-error | unknown".split(' | ')

          },

          {

            generalProperties: {

              fieldApiName: 'intent',
              fieldName: 'Intent of the Request',
              fieldLabel: 'Intent of the Request',
              value: 'order',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: "proposal | plan | directive | order | original-order | reflex-order | filler-order | instance-order | option".split(' | ')

          }
        ];

        // Only add code field if typeOfService exists
        if (this.data?.typeOfService) {
          fieldsArray.push({

            generalProperties: {

              fieldApiName: 'code',
              fieldName: 'Service Requested',
              fieldLabel: 'Service Requested',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              allowedOthers: true,
              fieldType: 'CodeableConceptFieldFromBackEnd',
              isArray: false,
              isGroup: false
            },
            data: g.code
          });
        }

        // Add remaining fields
        fieldsArray.push(
          {

            generalProperties: {

              fieldApiName: 'performerType',
              fieldName: 'Pratitioner Required',
              fieldLabel: 'Practitioner Required',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.performerType
          },
          {

            generalProperties: {

              fieldApiName: 'priority',
              fieldName: 'Priority',
              fieldLabel: 'Priority',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: "routine | urgent | asap | stat".split(' | ')
          },
          {

            generalProperties: {

              fieldApiName: 'note',
              fieldName: 'Additional Details',
              fieldLabel: 'Additional Details',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              inputType: 'textarea',
              isArray: false,
              isGroup: false
            },
            data: g.priority
          }
          //category
        );

        // Assign the built array to formFields
        this.formFields = fieldsArray;

        // this.medicineForms.push({ formMetaData: this.formMetaData, formFields: [...this.formFields] });

        // Build the initial item in the FormArray once fields are available
        // this.items.push(this.buildItemGroup());
      },
      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');
      }
    })
  }

  addMoreMedicineRequest() {

    if (this.formMetaData && this.formFields) {
      // this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];
      // Add another group mirroring current formFields
      this.items.push(this.buildItemGroup());
    }
  }

  @ViewChild('cref') dynamicFormComponent!: DynamicFormsV2Component;
  processValues(values: any) {
    if (!values) return;

    if (!values.code || values.code == '' ||
      values.intent == '' || !values.intent ||
      values.status == '' || !values.status

    ) {
      this.errorService.openandCloseError('Status, Intent and Service Requested fields are required.');

      return;
    }


    if (!this.isMultiple.value || this.isMultiple.value == 'Single') {
      if (this.dialogRef) {
        this.dialogRef.close({ values: values });
      }
    }
    //vallidationbefore `pushing

    this.items.push(this.buildItemGroup(values));
  }

  submitAllRequests() {
    const allValues = this.items.value;
    if (this.dialogRef) {
      this.dialogRef.close({ values: allValues });
    }
  }
}
