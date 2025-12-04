import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData } from '../shared/dynamic-forms.interface2';
import { GroupField, IndividualField, CodeField, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { StateService } from '../shared/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { Router } from '@angular/router';
import { CodeSystem, Bundle, ValueSet } from 'fhir/r4';
import { HttpClient } from '@angular/common/http';
import { backendEndPointToken } from '../app.config';

type FormFields = IndividualField | GroupField | CodeField | SingleCodeField;

@Component({
  selector: 'app-add-service-request-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    DynamicFormsV2Component
  ],
  templateUrl: './add-service-request-codes.component.html',
  styleUrls: ['./add-service-request-codes.component.scss']
})
export class AddServiceRequestCodesComponent implements OnInit {
  private formFieldsDataService = inject(FormFieldsSelectDataService);
  private errorService = inject(ErrorService);
  private fhirResourceService = inject(FhirResourceService);
  private stateService = inject(StateService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private http = inject(HttpClient);
  private backendUrl = inject(backendEndPointToken);

  loading = false;
  formMetaData?: formMetaData;
  formFields?: FormFields[];

  // Track existing CodeSystem for update mode
  private existingCodeSystem: CodeSystem | null = null;
  private isUpdateMode = false;

  // ✅ Generate CodeSystem base URL from backend endpoint
  private get SERVICE_REQUEST_CODESYSTEM_BASE_URL(): string {
    // Extract base URL from backend endpoint (e.g., "https://elikita-server.daalitech.com")
    // and construct CodeSystem URL
    return `${this.backendUrl}/CodeSystem/ServiceRequest`;
  }

  ngOnInit(): void {
    this.loading = true;

    const codeSystemUrl = `${this.SERVICE_REQUEST_CODESYSTEM_BASE_URL}/ServiceRequestCodes`;

    // Check if CodeSystem already exists
    this.http.get<Bundle<CodeSystem>>(
      `${this.backendUrl}/CodeSystem?url=${encodeURIComponent(codeSystemUrl)}`
    ).subscribe({
      next: (response) => {
        if (response?.entry && response.entry.length > 0) {
          // CodeSystem exists - switch to UPDATE mode
          this.existingCodeSystem = response.entry[0].resource as CodeSystem;
          this.isUpdateMode = true;
          console.log('📝 UPDATE MODE: Existing CodeSystem found', this.existingCodeSystem);
          this.initializeFormFields(true, this.existingCodeSystem);
        } else {
          // No existing CodeSystem - CREATE mode
          this.isUpdateMode = false;
          console.log('✨ CREATE MODE: No existing CodeSystem');
          this.initializeFormFields(false);
        }
      },
      error: () => {
        // On error, default to CREATE mode
        this.isUpdateMode = false;
        this.initializeFormFields(false);
      }
    });
  }

  private initializeFormFields(updateMode: boolean, existingCodeSystem?: CodeSystem): void {
    // Form metadata
    this.formMetaData = {
      formName: updateMode ? 'Add Service Codes to Existing System' : 'Create Service Request Code System',
      formDescription: updateMode
        ? `Adding new service codes to: "${existingCodeSystem?.title}". System metadata is read-only.`
        : 'Define a new CodeSystem for service request codes across all categories (Laboratory, Imaging, Procedures, Vitals, Therapy, etc.)',
      submitText: updateMode ? 'Add New Codes' : 'Create Service Code System'
    };

    // Define form fields
    this.formFields = [
      // Title field - Hidden in UPDATE mode, shown in CREATE mode
      ...(updateMode ? [] : [
        <IndividualField>{
          generalProperties: {
            fieldApiName: 'title',
            fieldName: 'Title',
            fieldLabel: 'Title',
            fieldPlaceholder: 'e.g., Hospital Service Request Codes',
            fieldHint: 'A human-readable name for this code system (can cover multiple categories)',
            auth: { read: 'all', write: 'admin' },
            isArray: false,
            isGroup: false,
            inputType: 'text'
          }
        }
      ]),

      // Name field - Hidden in UPDATE mode, shown in CREATE mode
      ...(updateMode ? [] : [
        <IndividualField>{
          generalProperties: {
            fieldApiName: 'name',
            fieldName: 'Name',
            fieldLabel: 'Name (Machine-readable)',
            fieldPlaceholder: 'e.g., HospitalServiceCodes',
            fieldHint: 'Computer-friendly name (no spaces, use CamelCase)',
            auth: { read: 'all', write: 'admin' },
            isArray: false,
            isGroup: false,
            inputType: 'text'
          }
        }
      ]),

      // Description field - Hidden in UPDATE mode
      ...(updateMode ? [] : [
        <IndividualField>{
          generalProperties: {
            fieldApiName: 'description',
            fieldName: 'Description',
            fieldLabel: 'Description',
            fieldPlaceholder: 'Describe the purpose of this code system',
            fieldHint: 'A detailed description of what this code system represents',
            auth: { read: 'all', write: 'admin' },
            isArray: false,
            isGroup: false,
            inputType: 'textarea'
          }
        }
      ]),

      // Status field - Hidden in UPDATE mode
      ...(updateMode ? [] : [
        <SingleCodeField>{
          generalProperties: {
            fieldApiName: 'status',
            fieldName: 'Status',
            fieldLabel: 'Status',
            fieldType: 'CodeField',
            auth: { read: 'all', write: 'admin' },
            isArray: false,
            isGroup: false,
            value: 'active'
          },
          data: ['draft', 'active', 'retired']
        }
      ]),

      // Purpose field - Hidden in UPDATE mode
      ...(updateMode ? [] : [
        <IndividualField>{
          generalProperties: {
            fieldApiName: 'purpose',
            fieldName: 'Purpose',
            fieldLabel: 'Purpose',
            fieldPlaceholder: 'Why is this code system needed?',
            fieldHint: 'Explain why this code system exists and how it should be used',
            auth: { read: 'all', write: 'admin' },
            isArray: false,
            isGroup: false,
            inputType: 'textarea'
          }
        }
      ]),

      // Concept field - Always shown (this is what user adds)
      <GroupField>{
        generalProperties: {
          fieldApiName: 'concept',
          fieldName: updateMode ? 'New Service Codes to Add' : 'Service Codes',
          fieldLabel: updateMode ? 'New Service Codes to Add' : 'Service Codes',
          groupFieldsHint: updateMode
            ? `Add new service codes to the existing "${existingCodeSystem?.title}" system`
            : 'Define individual service codes (Lab tests, Imaging procedures, Vital signs, Therapies, etc.)',
          fieldType: 'IndividualField',
          auth: { read: 'all', write: 'admin' },
          isArray: true,
          isGroup: true
        },
        keys: ['category', 'code', 'display', 'definition', 'active'],
        groupFields: {
          category: <SingleCodeField>{
            generalProperties: {
              fieldApiName: 'category',
              fieldName: 'Category',
              fieldLabel: 'Category',
              fieldPlaceholder: 'Select or enter a category',
              fieldHint: 'Service category (Laboratory, Imaging, Procedure, Vitals, Therapy, etc.)',
              fieldType: 'CodeField',
              auth: { read: 'all', write: 'admin' },
              isArray: false,
              isGroup: false,
              allowOthers: true
            },
            dataType: 'SingleCodeField',
            data: [
              'Laboratory',
              'Imaging',
              'Procedure',
              'Vital Signs',
              'Therapy',
              'Surgical Procedure',
              'Diagnostic Procedure',
              'Pathology',
              'Radiology',
              'Cardiology',
              'Neurology',
              'Social Service',
              'Nursing',
              'Pharmacy',
              'Consultation',
              'Others'
            ]
          },
          code: <IndividualField>{
            generalProperties: {
              fieldApiName: 'code',
              fieldName: 'Code',
              fieldLabel: 'Code',
              fieldPlaceholder: 'e.g., CBC, XRAY-CHEST',
              fieldHint: 'Unique identifier for this service (no spaces)',
              auth: { read: 'all', write: 'admin' },
              isArray: false,
              isGroup: false,
              inputType: 'text'
            }
          },
          display: <IndividualField>{
            generalProperties: {
              fieldApiName: 'display',
              fieldName: 'Display Name',
              fieldLabel: 'Display Name',
              fieldPlaceholder: 'e.g., Complete Blood Count',
              fieldHint: 'Human-readable name for this service',
              auth: { read: 'all', write: 'admin' },
              isArray: false,
              isGroup: false,
              inputType: 'text'
            }
          },
          definition: <IndividualField>{
            generalProperties: {
              fieldApiName: 'definition',
              fieldName: 'Definition',
              fieldLabel: 'Definition',
              fieldPlaceholder: 'Describe what this service code represents',
              fieldHint: 'Detailed description of this specific service',
              auth: { read: 'all', write: 'admin' },
              isArray: false,
              isGroup: false,
              inputType: 'textarea'
            }
          },
          active: <IndividualField>{
            generalProperties: {
              fieldApiName: 'active',
              fieldName: 'Active',
              fieldLabel: 'Is Active?',
              fieldHint: 'Whether this code is currently in use',
              auth: { read: 'all', write: 'admin' },
              isArray: false,
              isGroup: false,
              inputType: 'toggle',
              value: true
            }
          }
        }
      }
    ];

    this.loading = false;
  }

  onFormSubmit(formData: any): void {
    console.log('📋 Service Code Form Submitted:', formData);

    // Validation for new concepts
    if (!formData.concept || formData.concept.length === 0) {
      this.errorService.openandCloseError('At least one service code must be defined');
      return;
    }

    // ✅ Filter out incomplete concepts
    const skippedConcepts: Array<{ index: number; reason: string }> = [];
    const validConcepts = formData.concept.filter((c: any, index: number) => {
      if (!c.code) {
        skippedConcepts.push({ index: index + 1, reason: 'missing code' });
        return false;
      }
      if (!c.display) {
        skippedConcepts.push({ index: index + 1, reason: 'missing display name' });
        return false;
      }
      return true;
    });

    if (skippedConcepts.length > 0) {
      const skippedMessages = skippedConcepts.map(s => `Element #${s.index} (${s.reason})`).join(', ');
      console.warn('⚠️ Skipped incomplete concepts:', skippedMessages);

      this.snackBar.open(
        `ℹ️ Skipped ${skippedConcepts.length} incomplete concept(s): ${skippedMessages}`,
        'Dismiss',
        { duration: 5000, panelClass: 'info-snackbar' }
      );
    }

    if (validConcepts.length === 0) {
      this.errorService.openandCloseError('No valid service codes to submit.');
      return;
    }

    // Generate CodeSystem URL
    const codeSystemUrl = `${this.SERVICE_REQUEST_CODESYSTEM_BASE_URL}/ServiceRequestCodes`;

    // Check for duplicates
    this.checkForDuplicates(codeSystemUrl, validConcepts).then((duplicateCheckResult) => {
      if (duplicateCheckResult.blockSubmission) {
        this.errorService.openandCloseError(
          duplicateCheckResult.error || 'Unable to verify duplicates. Please try again.'
        );
        return;
      }

      if (duplicateCheckResult.codeSystemDuplicate) {
        this.errorService.openandCloseError('Duplicate concept codes found. Please review and modify.');
        return;
      }

      // Build CodeSystem resource
      const codeSystem: CodeSystem = this.isUpdateMode
        ? this.buildUpdatedCodeSystem(validConcepts)
        : this.buildNewCodeSystem(formData, validConcepts, codeSystemUrl);

      console.log('🔥 FHIR CodeSystem:', codeSystem);
      console.log(`📝 Operation: ${this.isUpdateMode ? 'PUT (Update)' : 'POST (Create)'}`);

      // Generate ValueSets
      const valueSets = this.generateValueSets(codeSystem, validConcepts);
      console.log('📦 Generated ValueSets:', valueSets);

      // Filter out duplicate ValueSets
      const newValueSets = valueSets.filter(vs =>
        !duplicateCheckResult.duplicateValueSetUrls.includes(vs.url || '')
      );

      if (newValueSets.length < valueSets.length) {
        const skippedCount = valueSets.length - newValueSets.length;
        console.warn(`⚠️ Skipping ${skippedCount} duplicate ValueSet(s)`);
        this.snackBar.open(
          `ℹ️ ${skippedCount} ValueSet(s) already exist and will be skipped`,
          'Dismiss',
          { duration: 4000 }
        );
      }

      // Create Bundle
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: codeSystem,
            request: {
              method: this.isUpdateMode ? 'PUT' as const : 'POST' as const,
              url: this.isUpdateMode ? `CodeSystem/${this.existingCodeSystem?.id}` : 'CodeSystem'
            }
          },
          ...newValueSets.map((vs: ValueSet) => ({
            resource: vs,
            request: {
              method: 'POST' as const,
              url: 'ValueSet'
            }
          }))
        ]
      };

      console.log('🚀 Bundle ready for submission:', bundle);
      console.log('📊 Bundle Summary:');
      console.log(`  - Total entries: ${bundle.entry?.length}`);
      console.log(`  - CodeSystem count: 1`);
      console.log(`  - ValueSet count: ${newValueSets.length}`);
      console.log(`  - Valid concepts: ${validConcepts.length}`);
      console.log(`  - Skipped concepts: ${skippedConcepts.length}`);
      console.log(`  - Skipped ValueSets: ${valueSets.length - newValueSets.length}`);
      console.log(`  - Operation: ${this.isUpdateMode ? 'UPDATE existing CodeSystem' : 'CREATE new CodeSystem'}`);
      console.log('');
      console.log('🔍 Detailed Bundle Structure:');
      console.log(JSON.stringify(bundle, null, 2));

      // ⛔ BLOCKED FOR DEBUGGING
      console.warn('⛔ SUBMISSION BLOCKED FOR DEBUGGING');
      console.warn('📝 To enable submission, uncomment the HTTP post code');

      /*
      this.http.post<Bundle>(this.backendUrl, bundle).subscribe({
        next: (response) => {
          console.log('✅ CodeSystem and ValueSets created/updated successfully:', response);

          const createdCodeSystem = response.entry?.find(e => e.resource?.resourceType === 'CodeSystem')?.resource;
          if (createdCodeSystem) {
            this.stateService.persistOrgWideResource(createdCodeSystem, 'saved');
          }

          const createdValueSets = response.entry?.filter(e => e.resource?.resourceType === 'ValueSet').map(e => e.resource);
          createdValueSets?.forEach(vs => {
            if (vs) this.stateService.persistOrgWideResource(vs, 'saved');
          });

          this.snackBar.openFromComponent(SuccessMessageComponent, {
            data: { message: this.isUpdateMode ? `Added ${validConcepts.length} new codes` : `Service code system created with ${newValueSets.length} value sets` },
            duration: 3000
          });

          this.router.navigate(['/app/service-codes']);
        },
        error: (err) => {
          console.error('❌ Error:', err);
          this.errorService.openandCloseError('Failed to submit service codes. Please try again.');
        }
      });
      */
    });
  }

  /**
   * Build new CodeSystem (CREATE mode)
   */
  private buildNewCodeSystem(formData: any, validConcepts: any[], url: string): CodeSystem {
    if (!formData.title || !formData.name) {
    //   throw new Error('Title and Name are required for new CodeSystem');
      this.errorService.openandCloseError('Title and Name are required for new CodeSystem');
      throw new Error('Title and Name are required for new CodeSystem');        
    }

    return {
      resourceType: 'CodeSystem',
      url, // ✅ URL is now generated from backend endpoint
      version: '1.0.0',
      title: formData.title,
      name: formData.name,
      status: formData.status || 'active',
      description: formData.description,
      purpose: formData.purpose,
      content: 'complete',
      count: validConcepts.length,
      property: [
        {
          code: 'category',
          uri: `${this.backendUrl}/CodeSystem/property/category`,
          description: 'The category this service belongs to',
          type: 'string'
        },
        {
          code: 'active',
          uri: `${this.backendUrl}/CodeSystem/property/active`,
          description: 'Whether this code is currently active',
          type: 'boolean'
        }
      ],
      concept: validConcepts.map((c: any) => this.buildConcept(c))
    };
  }

  /**
   * Build updated CodeSystem (UPDATE mode)
   * ✅ ONLY updates concepts array, keeps all other metadata unchanged
   */
  private buildUpdatedCodeSystem(validConcepts: any[]): CodeSystem {
    if (!this.existingCodeSystem) {
      throw new Error('No existing CodeSystem found for update');
    }

    // ✅ Keep ALL existing properties, only add new concepts
    return {
      ...this.existingCodeSystem, // Keep all existing properties
      count: (this.existingCodeSystem.concept?.length || 0) + validConcepts.length,
      concept: [
        ...(this.existingCodeSystem.concept || []), // Keep existing concepts
        ...validConcepts.map((c: any) => this.buildConcept(c)) // Add new concepts
      ]
    };
  }

  /**
   * Build a single concept with properties
   */
  private buildConcept(c: any): any {
    const properties: any[] = [];

    if (c.category) {
      properties.push({
        code: 'category',
        valueString: c.category
      });
    }

    if (c.active !== undefined) {
      properties.push({
        code: 'active',
        valueBoolean: c.active
      });
    }

    return {
      code: c.code,
      display: c.display,
      definition: c.definition || undefined,
      property: properties.length > 0 ? properties : undefined
    };
  }

  /**
   * Generate ValueSets based on categories and active status
   * Creates:
   * 1. One ValueSet per category containing ONLY ACTIVE codes in that category (using filter)
   * 2. One ValueSet for all active codes (across all categories) (using filter)
   * 3. One master ValueSet for all codes (using includeAll)
   */
  private generateValueSets(codeSystem: CodeSystem, concepts: any[]): ValueSet[] {
    const valueSets: ValueSet[] = [];
    const baseCodeSystemUrl = codeSystem.url || '';
    // ✅ Generate ValueSet URL from backend endpoint
    // Replace "/CodeSystem/ServiceRequest/" with "/ValueSet/ServiceRequest/"
    const baseValueSetUrl = baseCodeSystemUrl.replace('/CodeSystem/ServiceRequest/', '/ValueSet/ServiceRequest/');
    const baseName = codeSystem.name || 'ServiceCode';

    // Extract unique categories from submitted concepts
    const categories = new Set<string>();
    concepts.forEach(c => {
      if (c.category) categories.add(c.category);
    });

    // 1. Create ValueSet for each category - ONLY ACTIVE codes (using filter)
    categories.forEach(category => {
      valueSets.push({
        resourceType: 'ValueSet',
        url: `${baseValueSetUrl}${category.replace(/\s+/g, '')}`,
        version: '1.0.0',
        name: `${baseName}${category.replace(/\s+/g, '')}`,
        title: `${codeSystem.title} - ${category} (Active Only)`,
        status: codeSystem.status,
        description: `Value set for active ${category} service codes only`,
        compose: {
          include: [
            {
              system: baseCodeSystemUrl,
              // ✅ Use filter to select codes matching category AND active=true
              filter: [
                {
                  property: 'category',
                  op: '=',
                  value: category
                },
                {
                  property: 'active',
                  op: '=',
                  value: 'true'
                }
              ]
            }
          ]
        }
      });
    });

    // 2. Create ValueSet for ALL active codes (across all categories) (using filter)
    valueSets.push({
      resourceType: 'ValueSet',
      url: `${baseValueSetUrl}Active`,
      version: '1.0.0',
      name: `${baseName}Active`,
      title: `${codeSystem.title} - All Active Codes`,
      status: codeSystem.status,
      description: `Value set containing all active service codes across all categories`,
      compose: {
        include: [
          {
            system: baseCodeSystemUrl,
            // ✅ Use filter to select only active codes
            filter: [
              {
                property: 'active',
                op: '=',
                value: 'true'
              }
            ]
          }
        ]
      }
    });

    // 3. Create master ValueSet for ALL codes (active + inactive, all categories)
    // Use system-level inclusion without filter (includes everything)
    valueSets.push({
      resourceType: 'ValueSet',
      url: `${baseValueSetUrl}All`,
      version: '1.0.0',
      name: `${baseName}All`,
      title: `${codeSystem.title} - All Codes (Active & Inactive)`,
      status: codeSystem.status,
      description: `Value set containing all service codes regardless of category or active status`,
      compose: {
        include: [
          {
            system: baseCodeSystemUrl
            // ✅ No filter = include all concepts from this CodeSystem
          }
        ]
      }
    });

    return valueSets;
  }

  /**
   * Check for duplicate CodeSystem and ValueSets in existing resources
   * ✅ Updated: Returns object with separate flags for CodeSystem and ValueSet duplicates
   * ⚠️ IMPORTANT: Returns blockSubmission: true on error (fail-safe approach)
   * @param url - The URL of the CodeSystem being created
   * @param concepts - Array of concepts to check
   * @returns Promise<{codeSystemDuplicate: boolean, duplicateValueSetUrls: string[], existingCodeSystem: CodeSystem | null, blockSubmission: boolean, error?: string}>
   */
  private async checkForDuplicates(url: string, concepts: any[]): Promise<{
    codeSystemDuplicate: boolean;
    duplicateValueSetUrls: string[];
    existingCodeSystem: CodeSystem | null;
    blockSubmission: boolean;
    error?: string;
  }> {
    try {
      // STEP 1: Check for existing CodeSystem with the same URL
      console.log('🔍 Step 1: Checking for duplicate CodeSystem URL:', url);
      const codeSystemResponse: any = await this.http.get<Bundle<CodeSystem>>(
        `${this.backendUrl}/CodeSystem?url=${encodeURIComponent(url)}`
      ).toPromise();

      let codeSystemDuplicate = false;
      let existingCodeSystem: CodeSystem | null = null;

      if (codeSystemResponse?.entry && codeSystemResponse.entry.length > 0) {
        existingCodeSystem = codeSystemResponse.entry[0].resource as CodeSystem;
        console.log('⚠️ Found existing CodeSystem:', existingCodeSystem);

        // Check for duplicate codes or displays within existing CodeSystem
        const existingConcepts = existingCodeSystem.concept || [];
        const duplicates: string[] = [];

        concepts.forEach((newConcept: any) => {
          const duplicateCode = existingConcepts.find(
            ec => ec.code?.toLowerCase() === newConcept.code?.toLowerCase()
          );
          const duplicateDisplay = existingConcepts.find(
            ec => ec.display?.toLowerCase() === newConcept.display?.toLowerCase()
          );

          if (duplicateCode) {
            duplicates.push(`Code "${newConcept.code}" already exists in CodeSystem`);
          }
          if (duplicateDisplay) {
            duplicates.push(`Display "${newConcept.display}" already exists in CodeSystem`);
          }
        });

        if (duplicates.length > 0) {
          console.error('❌ Duplicate codes/displays found in CodeSystem:', duplicates);
          alert(`Duplicate codes or displays found:\n\n${duplicates.join('\n')}\n\nPlease modify before submitting.`);
          codeSystemDuplicate = true;
        } else {
          console.log('✅ No duplicate concepts found - will UPDATE existing CodeSystem with new concepts');
        }
      } else {
        console.log('✅ No existing CodeSystem found with this URL');
      }

      // STEP 2: Check for duplicate ValueSet URLs (but don't block CodeSystem creation)
      console.log('🔍 Step 2: Checking for duplicate ValueSet URLs');
      
      // ✅ Generate ValueSet URL from CodeSystem URL
      // The CodeSystem URL is already using the backend endpoint, so we just replace the path
      const baseValueSetUrl = url.replace('/CodeSystem/ServiceRequest/', '/ValueSet/ServiceRequest/');
      const categories = new Set<string>();
      concepts.forEach(c => {
        if (c.category) categories.add(c.category);
      });

      const valueSetUrlsToCheck: string[] = [
        ...Array.from(categories).map(cat => `${baseValueSetUrl}${cat.replace(/\s+/g, '')}`),
        `${baseValueSetUrl}Active`,
        `${baseValueSetUrl}All`
      ];

      console.log('📋 ValueSet URLs to validate:', valueSetUrlsToCheck);

      const duplicateValueSetUrls: string[] = [];
      
      for (const vsUrl of valueSetUrlsToCheck) {
        const valueSetResponse: any = await this.http.get<Bundle<ValueSet>>(
          `${this.backendUrl}/ValueSet?url=${encodeURIComponent(vsUrl)}`
        ).toPromise();

        if (valueSetResponse?.entry && valueSetResponse.entry.length > 0) {
          const existingValueSet = valueSetResponse.entry[0].resource as ValueSet;
          console.log('⚠️ Found existing ValueSet:', existingValueSet);
          duplicateValueSetUrls.push(vsUrl);
        }
      }

      if (duplicateValueSetUrls.length > 0) {
        console.warn('⚠️ Found duplicate ValueSets (will be skipped):', duplicateValueSetUrls);
      }

      console.log('✅ Duplicate check complete');
      return {
        codeSystemDuplicate,
        duplicateValueSetUrls,
        existingCodeSystem,
        blockSubmission: false // All checks passed successfully
      };

    } catch (error: any) {
      console.error('❌ Error checking for duplicates:', error);
      
      // Determine error message
      const errorMessage = error?.message || error?.error?.message || 'Network error occurred while checking for duplicates';
      
      // ✅ FAIL-SAFE: Block submission on error
      this.errorService.openandCloseError(
        `Unable to verify if duplicates exist. ${errorMessage}. Please check your connection and try again.`
      );
      
      return {
        codeSystemDuplicate: false,
        duplicateValueSetUrls: [],
        existingCodeSystem: null,
        blockSubmission: true, // ⚠️ BLOCK submission when we can't verify
        error: errorMessage
      };
    }
  }
}
