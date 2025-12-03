import { Component, ElementRef, inject, Inject, Input, Optional, Self, ViewChild, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorService } from '../../shared/error.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { commonImports } from '../../shared/table-interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, of, startWith, tap } from 'rxjs';
import { AdmissionService } from './admission.service';
import { InfoDialogService } from '../../shared/info-dialog/info-dialog.service';
import { StateService } from '../../shared/state.service';
import { HttpClient } from '@angular/common/http';
import { backendEndPointToken } from '../../app.config';
import { Encounter } from 'fhir/r4';
import { CarePlanFormComponent } from '../care-plan-form/care-plan-form.component';

abstract class MatDialogProv {

}
@Component({
  selector: 'app-add-admission',
  imports: [...commonImports, CommonModule,
    MatAutocompleteModule, ReactiveFormsModule,
    MatSelectModule, MatTooltipModule, DynamicFormsV2Component, CarePlanFormComponent],
  templateUrl: './add-admission.component.html',
  providers: [{ provide: MatDialogProv, useExisting: MAT_DIALOG_DATA }],
  styleUrls: ['../../shared/dynamic-forms-v2/dynamic-forms-v2.component.scss', './add-admission.component.scss']
})
export class AddAdmissionComponent implements OnDestroy {
  admService = inject(AdmissionService);
  infoDialogService = inject(InfoDialogService);
  stateService = inject(StateService);
  http = inject(HttpClient);
  errorService = inject(ErrorService);
  private readonly backendUrl = inject(backendEndPointToken);
  private readonly dialogRef = inject(MatDialogRef<AddAdmissionComponent>, { optional: true });

  @Input() formMetaData: any;
  @Input() formFieldsToUse: any;

  // ✅ Initialize as empty object to avoid null errors
  encounterToSubmit: Partial<Encounter> = {};

  // Track whether we're updating or creating
  isUpdatingExistingEncounter = false;

  locationForm?: FormGroup;
  fb = inject(FormBuilder);
  wardFormFilter?: Observable<any[]>;
  roomFormFilter?: Observable<any[]>;
  bedFormFilter?: Observable<any[]>;

  @ViewChild('roomInput') roomInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bedInput') bedInput!: ElementRef<HTMLInputElement>;

  // ✅ NEW: Track submission state
  submittingAdmission = false;
  admissionSubmitted = false;

  constructor(@Optional() @Self() @Inject(MatDialogProv) public data?: any) {


  }
  displayDisplay(val: any) {
    return val.display || '';
  }

  ngOnInit() {
    if (this.data) {
      this.formMetaData = this.data.formMetaData;
      this.formFieldsToUse = this.data.formFieldsToUse;

      // Initialize encounter from admission service
      const currentEncounter = this.admService.getCurrentEncounter();
      if (currentEncounter) {
        this.encounterToSubmit = { ...currentEncounter };
        this.isUpdatingExistingEncounter = !!currentEncounter.id;
      }
    }

    // Show info about encounter handling
    this.infoDialogService.show(
      'If an active encounter exists for this patient, the admission will be linked to it. Otherwise, a new encounter will be created automatically.',
      {
        title: 'Encounter Information',
        duration: 5000
      }
    );

    if (this.formFieldsToUse.location) {
      this.locationForm = this.fb.group({
        'ward': '',
        'room': '',
        'bed': ""
      });
    }

    // Ward filter - map Location objects to { reference, display } format
    this.wardFormFilter = this.locationForm?.get(['ward'])?.valueChanges.pipe(
      startWith(""),
      tap((wardValue: any) => {
        this.locationForm?.get(['room'])?.setValue("");
        // When a ward is selected, filter rooms that belong to this ward
        const wardRef = wardValue?.reference;
        if (wardRef) {
          this.formFieldsToUse.location.formFields[1].useableData =
            this.formFieldsToUse.location.formFields[1].data
              .filter((roomLocation: any) => {
                return roomLocation.partOf?.reference === wardRef;
              })
          this.locationForm?.get(['room'])?.setValue("");

          //enable
          if (this.roomInput) {
            this.roomInput.nativeElement.disabled = false;
          }
        } else {
          if (this.roomInput) {
            this.roomInput.nativeElement.disabled = true;
          }
        }
      }),
      map((searchValue: any) => {
        // Filter ward locations by search text and map to { reference, display }
        const allWards = this.formFieldsToUse.location.formFields[0].data || [];
        const searchText = searchValue?.display || searchValue?.reference || searchValue || '';

        return allWards
          .filter((loc: any) => {
            const name = loc.name || '';
            const ref = `Location/${loc.id}`;
            return name.toLowerCase().includes(searchText.toLowerCase()) ||
              ref.toLowerCase().includes(searchText.toLowerCase());
          })
          .map((loc: any) => ({
            reference: `Location/${loc.id}`,
            display: loc.name || 'Unnamed Ward'
          }));
      })
    );

    // Room filter - map filtered rooms to { reference, display } format
    this.roomFormFilter = this.locationForm?.get(['room'])?.valueChanges.pipe(
      startWith(""),
      tap((roomValue: any) => {
        this.locationForm?.get(['bed'])?.setValue("");
        const roomRef = roomValue?.reference;
        if (roomRef) {
          this.formFieldsToUse.location.formFields[2].useableData =
            this.formFieldsToUse.location.formFields[2].data
              .filter((bedLocation: any) => {
                return bedLocation.partOf?.reference === roomRef;
              })
              .map((loc: any) => ({
                reference: `Location/${loc.id}`,
                display: loc.name || 'Unnamed Bed'
              }));
          this.locationForm?.get(['bed'])?.setValue("");
          if (this.bedInput) {
            this.bedInput.nativeElement.disabled = false;
          }
        } else {
          if (this.bedInput) {
            this.bedInput.nativeElement.disabled = true;
          }
        }
      }),
      map((searchValue: any) => {
        const availableRooms = this.formFieldsToUse.location.formFields[1].useableData || [];
        const searchText = searchValue?.display || searchValue?.reference || searchValue || '';

        return availableRooms.filter((item: any) => {
          return item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.name.toLowerCase().includes(searchText.toLowerCase());
        }).map((loc: any) => ({
          reference: `Location/${loc.id}`,
          display: loc.name || 'Unnamed Room'
        }));
      })
    );

    // Bed filter - map filtered beds to { reference, display } format
    this.bedFormFilter = this.locationForm?.get(['bed'])?.valueChanges.pipe(
      startWith(""),
      map((searchValue: any) => {
        const availableBeds = this.formFieldsToUse.location.formFields[2].useableData || [];
        const searchText = searchValue?.display || searchValue?.reference || searchValue || '';

        return availableBeds.filter((item: any) => {
          return item.display.toLowerCase().includes(searchText.toLowerCase()) ||
            item.reference.toLowerCase().includes(searchText.toLowerCase());
        });
      })
    );
  }

  showCarePlanForm = false;

  /**
   * Handle encounter form changes (auto-save behavior)
   * Updates encounter data in real-time without validation
   */
  onEncounterFormChange(formValues: any): void {
    console.log('Encounter form changed (auto-saving):', formValues);

    if (!formValues || Object.keys(formValues).length === 0) {
      console.warn('Empty form values received');
      return;
    }

    // Initialize encounter if not already set
    if (!this.encounterToSubmit) {
      this.encounterToSubmit = this.admService.getCurrentEncounter() || {};
    }

    // ✅ Auto-save: Update fields without validation
    // Only update fields that have values (skip validation here)

    if (formValues.reason) {
      this.updateReasonCode(formValues.reason);
    }

    if (formValues.encounterStatus) {
      this.encounterToSubmit.status = formValues.encounterStatus as Encounter['status'];
    }

    if (formValues.encounterClass) {
      this.encounterToSubmit.class = {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: this.mapEncounterClassCode(formValues.encounterClass),
        display: formValues.encounterClass
      };
    }

    if (formValues['admission.admitSource']) {
      this.updateAdmitSource(formValues['admission.admitSource']);
      this.addPreAdmissionIdentifier();
    }

    // Check if encounter has ID (determines POST vs PUT)
    this.isUpdatingExistingEncounter = !!this.encounterToSubmit.id;

    console.log('Auto-saved encounter:', this.encounterToSubmit);
  }

  /**
   * Update reason code from various input formats
   */
  private updateReasonCode(reason: any): void {
    if (!this.encounterToSubmit) return;

    // Handle CodeableConceptFieldFromBackEnd format (code$#$display$#$system)
    if (typeof reason === 'string' && reason.includes('$#$')) {
      const [code, display, system] = reason.split('$#$');
      this.encounterToSubmit.reasonCode = [{
        coding: [{
          code: code?.trim(),
          display: display?.trim(),
          system: system?.trim()
        }],
        text: display?.trim()
      }];
    }
    // Handle object with code, display, system properties
    else if (
      typeof reason === 'object' &&
      reason !== null &&
      ['code', 'display', 'system'].every(prop => prop in reason) &&
      (reason.code || reason.display)
    ) {
      this.encounterToSubmit.reasonCode = [{
        coding: [{
          code: reason.code?.trim() || undefined,
          display: reason.display?.trim() || undefined,
          system: reason.system?.trim() || undefined
        }],
        text: reason.display?.trim() || reason.code?.trim()
      }];
    }
    // Fallback to plain text
    else if (typeof reason === 'string') {
      this.encounterToSubmit.reasonCode = [{ text: reason }];
    }
    // Handle object with only 'text' property
    else if (typeof reason === 'object' && reason?.text) {
      this.encounterToSubmit.reasonCode = [{ text: reason.text }];
    }
  }

  /**
   * Update admit source in hospitalization
   */
  private updateAdmitSource(admitSource: any): void {
    if (!this.encounterToSubmit) return;

    if (!this.encounterToSubmit.hospitalization) {
      this.encounterToSubmit.hospitalization = {};
    }

    // Set admit source
    if (typeof admitSource === 'string' && admitSource.includes('$#$')) {
      const [code, display, system] = admitSource.split('$#$');
      this.encounterToSubmit.hospitalization.admitSource = {
        coding: [{
          code: code?.trim(),
          display: display?.trim(),
          system: system?.trim()
        }],
        text: display?.trim()
      };
    } else {
      this.encounterToSubmit.hospitalization.admitSource = {
        text: admitSource
      };
    }
  }

  /**
   * Add custom admission identifier to hospitalization.preAdmissionIdentifier
   * Uses the backend endpoint token to avoid hardcoding system URLs
   */
  private addPreAdmissionIdentifier(): void {
    if (!this.encounterToSubmit.hospitalization) {
      this.encounterToSubmit.hospitalization = {};
    }

    // Generate unique admission identifier
    const admissionId = this.generateAdmissionIdentifier();
    const now = new Date().toISOString();

    // Check if preAdmissionIdentifier already exists
    if (!this.encounterToSubmit.hospitalization.preAdmissionIdentifier) {
      this.encounterToSubmit.hospitalization.preAdmissionIdentifier = {
        system: `${this.backendUrl}/admission-id`,
        value: admissionId,
        use: 'official',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'VN',
            display: 'Visit number'
          }],
          text: 'Admission Number'
        },
        period: {
          start: now
        },
        assigner: {
          display: 'e-Likita Hospital System'
        }
      };

      console.log('Added preAdmissionIdentifier:', admissionId);
    } else {
      console.log('preAdmissionIdentifier already exists, skipping update');
    }
  }

  /**
   * Generate unique admission identifier
   * Format: ADM-YYYYMMDD-RANDOM
   */
  private generateAdmissionIdentifier(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ADM-${dateStr}-${random}`;
  }

  /**
   * Map encounter class to FHIR code
   */
  private mapEncounterClassCode(encounterClass: string): string {
    const mapping: { [key: string]: string } = {
      'inpatient': 'IMP',
      'outpatient': 'AMB',
      'ambulatory': 'AMB',
      'emergency': 'EMER',
      'virtual': 'VR',
      'home': 'HH',
      'field': 'FLD'
    };

    return mapping[encounterClass.toLowerCase()] || encounterClass.toUpperCase();
  }

  /**
   * Validate encounter before submission
   * Only validates fields that are visible (not hidden) in the form
   */
  private validateEncounterForSubmission(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.encounterToSubmit) {
      errors.push('No encounter data available');
      return { valid: false, errors };
    }

    // ✅ Check for existing active admission
    const hasActiveAdmission = this.checkForActiveAdmission();
    if (hasActiveAdmission) {
      errors.push('Patient already has an active admission (encounter is in-progress with class=inpatient)');
      return { valid: false, errors };
    }

    // ✅ Only validate non-hidden required fields
    // encounterStatus and encounterClass are hidden with default values, so skip validation

    // Validate reason (CodeableConceptFieldFromBackEnd - visible and required)
    if (!this.encounterToSubmit.reasonCode || this.encounterToSubmit.reasonCode.length === 0) {
      errors.push('Reason for admission is required');
    }

    // Validate admission source (visible field)
    if (!this.encounterToSubmit.hospitalization?.admitSource) {
      errors.push('Admission source is required');
    }

    // Validate subject/patient reference (set by admission service, should always exist)
    if (!this.encounterToSubmit.subject?.reference) {
      errors.push('Patient reference is missing (system error)');
    }

    // Validate location assignment (ward, room, bed)
    if (this.locationForm) {
      const wardValue = this.locationForm.get('ward')?.value;
      const bedValue = this.locationForm.get('bed')?.value;

      if (!wardValue) {
        errors.push('Ward selection is required');
      }
      if (!bedValue) {
        errors.push('Bed selection is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if patient already has an active admission
   * An active admission is defined as:
   * - Encounter status: 'in-progress'
   * - Encounter class.code: 'IMP' (inpatient)
   * - Hospitalization data present (optional but indicative)
   * 
   * @returns true if active admission exists, false otherwise
   */
  private checkForActiveAdmission(): boolean {
    // Check StateService for existing encounters
    const patientEncounters = this.stateService.PatientResources.encounters.getValue();

    if (!patientEncounters || patientEncounters.length === 0) {
      console.log('No encounters found for patient');
      return false;
    }

    // Look for active admission encounter
    const hasActiveAdmission = patientEncounters.some(encounterWrapper => {
      const encounter = encounterWrapper.actualResource;

      // Check if encounter is in-progress
      const isInProgress = encounter.status === 'in-progress';

      // Check if encounter class is inpatient (IMP)
      const isInpatient = encounter.class?.code?.toUpperCase() === 'IMP' ||
        encounter.class?.display?.toLowerCase().includes('inpatient');

      // Check if hospitalization data exists (indicates admission)
      const hasHospitalization = !!encounter.hospitalization;

      // Additional check: has admission identifier
      const hasAdmissionId = encounter.hospitalization?.preAdmissionIdentifier?.value ||
        encounter.identifier?.some((id: any) =>
          id.system?.includes('admission-id')
        );

      const isActive = isInProgress && isInpatient;

      if (isActive) {
        console.log('🚫 Active admission found:', {
          encounterId: encounter.id,
          status: encounter.status,
          class: encounter.class,
          admissionId: encounter.hospitalization?.preAdmissionIdentifier?.value,
          hasHospitalization
        });
      }

      return isActive;
    });

    return hasActiveAdmission;
  }

  /**
   * Submit encounter (POST or PUT based on existence)
   * 
   * FLOW:
   * 1. Check encounter data exists
   * 2. Normalize encounter (fix hidden field values)
   * 3. Validate (check required fields + active admission)
   * 4. Add location references (ward/room/bed)
   * 5. Submit to backend (POST or PUT)
   * 6. Update state services
   * 7. Close dialog
   */
  submitEncounter(): void {
    // ✅ STEP 1: Check if encounter data exists
    if (Object.keys(this.encounterToSubmit).length === 0) {
      this.errorService.openandCloseError('No encounter data available');
      return;
    }

    // ✅ Prevent double submission
    if (this.submittingAdmission) {
      return;
    }

    this.submittingAdmission = true;

    // ✅ STEP 2: Normalize encounter for admission BEFORE validation
    // This ensures hidden fields (status, class) have correct standard values
    // Even if form pre-filled incorrect values, this fixes them
    this.encounterToSubmit = this.admService.updateEncounterWithAdmission(this.encounterToSubmit);

    console.log('📋 Normalized encounter:', this.encounterToSubmit);

    // ✅ STEP 3: Validation happens AFTER normalization
    const validation = this.validateEncounterForSubmission();

    if (!validation.valid) {
      // Enhanced error message for active admission case
      if (validation.errors.some(err => err.includes('already has an active admission'))) {
        this.errorService.openandCloseError(
          `❌ Cannot create new admission:\n\n` +
          `This patient already has an active admission in progress.\n` +
          `Please complete or cancel the existing admission before creating a new one.\n\n` +
          `Additional errors:\n• ${validation.errors.filter(e => !e.includes('already has an active admission')).join('\n• ')}`
        );
      } else {
        this.errorService.openandCloseError(
          `Cannot submit encounter. Please complete the following required fields:\n• ${validation.errors.join('\n• ')}`
        );
      }
      this.submittingAdmission = false;
      return;
    }

    // ✅ STEP 4: Add location references from location form (ward/room/bed)
    this.addLocationReferencesToEncounter();

    console.log('🏥 Encounter with locations:', this.encounterToSubmit);

    // ✅ STEP 5: Build FHIR Bundle transaction
    const bedValue = this.locationForm?.get('bed')?.value;
    const bedLocationId = bedValue?.reference?.split('/')?.[1]; // Extract ID from "Location/bed-123"
    const actualBedLocation = this.stateService.orgWideResources.locations.getValue()
      .find(wrapper => wrapper.actualResource?.id === bedLocationId)?.actualResource;

    // Prepare encounter entry
    const encounterEntry: any = {
      request: {
        method: this.isUpdatingExistingEncounter ? 'PUT' : 'POST',
        url: this.isUpdatingExistingEncounter
          ? `Encounter/${this.encounterToSubmit.id}`
          : 'Encounter'
      },
      resource: this.isUpdatingExistingEncounter
        ? this.encounterToSubmit
        : (() => {
          const { id, ...encounterWithoutId } = this.encounterToSubmit as any;
          return encounterWithoutId;
        })()
    };

    // Prepare bed location PATCH entry (update operationalStatus to occupied)
    const bedPatchEntry: any = bedLocationId && actualBedLocation ? {
      request: {
        method: 'PUT',
        url: `Location/${bedLocationId}`
      },
      resource: {
        ...actualBedLocation,
        operationalStatus: {

          system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
          code: 'O',
          display: 'Occupied'
        }



        // parameter: [
        //   {
        //     name: 'operation',
        //     part: [
        //       { name: 'type', valueCode: 'add' },
        //       { name: 'path', valueString: 'Location.operationalStatus' },
        //       { name: "name", valueString: "operationalStatus" },
        //       {
        //         name: 'value',
        //         valueCoding: {
        //           system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
        //           code: 'O',
        //           display: 'Occupied'
        //         }
        //       }
        //     ]

        //   }
        // ]
      }
    } : null;

    // Build Bundle transaction
    const bundleTransaction: any = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        encounterEntry,
        ...(bedPatchEntry ? [bedPatchEntry] : [])
      ]
    };

    console.log('📦 Bundle transaction:', JSON.stringify(bundleTransaction, null, 2));

    // ✅ STEP 6: Submit Bundle transaction
    const url = `${this.backendUrl}`;
    console.log(this.isUpdatingExistingEncounter ? '🔄 Updating encounter' : '➕ Creating encounter', 'via Bundle transaction');

    const request$ = this.http.post(url, bundleTransaction);

    // ✅ STEP 7: Execute HTTP request
    request$.subscribe({
      next: (response: any) => {
        console.log('✅ Bundle transaction successful:', response);

        const bundleResponse = response as any;
        const encounterEntry = bundleResponse.entry?.find((e: any) =>
          e.resource?.resourceType === 'Encounter'
        );
        const savedEncounter = encounterEntry?.resource;

        if (!savedEncounter) {
          console.error('❌ No encounter found in bundle response');
          this.errorService.openandCloseError('Failed to extract encounter from server response');
          this.submittingAdmission = false;
          return;
        }

        console.log('💾 Saved encounter:', savedEncounter);

        // ✅ STEP 8: Update StateService.PatientResources.encounters
        const currentEncounters = this.stateService.PatientResources.encounters.getValue();

        if (this.isUpdatingExistingEncounter && savedEncounter.id) {
          // UPDATE existing encounter in place
          const encounterIndex = currentEncounters.findIndex(
            wrapper => wrapper.actualResource?.id === savedEncounter.id
          );

          if (encounterIndex !== -1) {
            const updatedEncounters = [...currentEncounters];
            updatedEncounters[encounterIndex] = {
              referenceId: `Encounter/${savedEncounter.id}`,
              savedStatus: 'saved',
              actualResource: savedEncounter
            };
            this.stateService.PatientResources.encounters.next(updatedEncounters);
            console.log('✅ Updated existing encounter in PatientResources.encounters at index', encounterIndex);
          } else {
            console.warn('⚠️ Encounter ID not found in existing list, adding as new');
            this.stateService.PatientResources.encounters.next([
              {
                referenceId: `Encounter/${savedEncounter.id}`,
                savedStatus: 'saved',
                actualResource: savedEncounter
              },
              ...currentEncounters
            ]);
          }
        } else {
          // NEW encounter - add to beginning with unshift
          this.stateService.PatientResources.encounters.next([
            {
              referenceId: savedEncounter.id ? `Encounter/${savedEncounter.id}` : null,
              savedStatus: 'saved',
              actualResource: savedEncounter
            },
            ...currentEncounters
          ]);
          console.log('✅ Added new encounter to PatientResources.encounters (unshifted to start)');
        }

        // ✅ STEP 9: Update bed location in StateService (if PATCH was successful)
        if (bedLocationId && bundleResponse.entry?.length > 1) {
          const bedPatchResult = bundleResponse.entry.find((e: any) =>
            e.response?.location?.includes(`Location/${bedLocationId}`)
          );

          if (bedPatchResult) {
            const currentLocations = this.stateService.orgWideResources.locations.getValue();
            const bedIndex = currentLocations.findIndex(
              wrapper => wrapper.actualResource?.id === bedLocationId
            );

            if (bedIndex !== -1) {
              const updatedLocations = [...currentLocations];
              const bedLocation = updatedLocations[bedIndex].actualResource;

              // Update operational status to occupied
              updatedLocations[bedIndex] = {
                ...updatedLocations[bedIndex],
                actualResource: {
                  ...bedLocation,
                  operationalStatus: {

                    system: 'http://terminology.hl7.org/CodeSystem/v2-0116',
                    code: 'O',
                    display: 'Occupied'

                  }
                }
              };

              this.stateService.orgWideResources.locations.next(updatedLocations);
              console.log('🛏️ Updated bed operational status to Occupied for:', bedLocationId);
            }
          }
        }

        // ✅ STEP 10: Update currentEncounter
        this.stateService.setCurrentEncounter(savedEncounter);
        console.log('✅ StateService.currentEncounter updated');

        // ✅ STEP 11: Clear AdmissionService encounter
        this.admService.clearCurrentEncounter();
        console.log('🗑️ AdmissionService.currentEncounter cleared');

        // ✅ NEW: Mark admission as submitted
        this.submittingAdmission = false;
        this.admissionSubmitted = true;

        // Update encounterToSubmit with saved data for care plan reference
        this.encounterToSubmit = savedEncounter;

        // ✅ STEP 12: Show success notification
        this.infoDialogService.show(
          `Admission ${this.isUpdatingExistingEncounter ? 'updated' : 'created'} successfully!${bedLocationId ? ' Bed marked as occupied.' : ''}\n\nYou can now add a care plan (optional) or close this dialog.`,
          { title: 'Success', duration: 5000 }
        );

        // ✅ NEW: Scroll to care plan section
        setTimeout(() => {
          const carePlanSection = document.querySelector('.care-plan-section');
          if (carePlanSection) {
            carePlanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);

        // ✅ REMOVED: Don't auto-close dialog anymore
        // this.dialogRef?.close(savedEncounter);

        console.log('✅ Dialog kept open for optional care plan creation');
      },
      error: (error: any) => {
        console.error('❌ Bundle transaction failed:', error);

        const errorMessage = error.error?.issue?.[0]?.diagnostics ||
          error.error?.message ||
          error.message ||
          'Unknown error';

        console.error('📋 Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          fullError: error
        });

        this.errorService.openandCloseError(
          `Failed to ${this.isUpdatingExistingEncounter ? 'update' : 'create'} admission:\n\n${errorMessage}`
        );

        // ✅ Reset submission state on error
        this.submittingAdmission = false;
      }
    });
  }

  /**
   * ✅ NEW: Close dialog manually (for "Close" button or after care plan submission)
   */
  closeDialog(): void {
    // Pass the submitted encounter back if admission was successful
    this.dialogRef?.close(this.admissionSubmitted ? this.encounterToSubmit : null);
  }

  /**
   * Add location references from location form to encounter
   * Adds ward, room, and bed as separate location entries
   */
  private addLocationReferencesToEncounter(): void {
    if (!this.locationForm || !this.encounterToSubmit) return;

    const wardValue = this.locationForm.get('ward')?.value;
    const roomValue = this.locationForm.get('room')?.value;
    const bedValue = this.locationForm.get('bed')?.value;

    // Initialize location array if not present
    if (!this.encounterToSubmit.location) {
      this.encounterToSubmit.location = [];
    }

    const now = new Date().toISOString();

    // Add bed location (primary admission location)
    if (bedValue?.reference) {
      this.encounterToSubmit.location.push({
        location: {
          reference: bedValue.reference,
          display: bedValue.display || 'Bed'
        },
        status: 'active',
        period: {
          start: now
        }
      });
      console.log('🛏️ Added bed location:', bedValue);
    }

    // Add room location (for reference)
    if (roomValue?.reference) {
      this.encounterToSubmit.location.push({
        location: {
          reference: roomValue.reference,
          display: roomValue.display || 'Room'
        },
        status: 'active'
      });
      console.log('🚪 Added room location:', roomValue);
    }

    // Add ward location (for reference)
    if (wardValue?.reference) {
      this.encounterToSubmit.location.push({
        location: {
          reference: wardValue.reference,
          display: wardValue.display || 'Ward'
        },
        status: 'active'
      });
      console.log('🏢 Added ward location:', wardValue);
    }
  }

  /**
   * Cleanup on component destroy (dialog close)
   * Clears encounter data from both component and admission service
   */
  ngOnDestroy(): void {
    console.log('AddAdmissionComponent destroyed - cleaning up');

    // ✅ Clear component encounter
    this.encounterToSubmit = {};
    this.isUpdatingExistingEncounter = false;

    // ✅ Clear admission service encounter
    // This prevents stale data from persisting if user reopens dialog
    this.admService.clearCurrentEncounter();

    console.log('Encounter data cleared from component and AdmissionService');
  }
}
