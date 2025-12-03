import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { forkJoin, switchMap, map } from 'rxjs';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { FhirResourceTransformService } from '../shared/fhir-resource-transform.service';

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
import { Location, Organization, Reference, Bundle, BundleEntry } from 'fhir/r4';
import { UtilityService } from '../shared/utility.service';
import { commonImports } from '../shared/table-interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { backendEndPointToken } from '../app.config';

@Component({
  selector: 'app-add-admission-location',
  standalone: true,
  imports: [CommonModule, DynamicFormsV2Component, ...commonImports, MatSlideToggleModule],
  templateUrl: './add-admission-location.component.html',
  styles: [`
    .add-admission-location { padding: 1rem; }
  `]
})
export class AddAdmissionLocationComponent implements AfterViewInit {
  // Services
  private readonly selectDataService = inject(FormFieldsSelectDataService);
  private readonly errorService = inject(ErrorService);
  private readonly utilityService = inject(UtilityService);
  private readonly cdk = inject(ChangeDetectorRef);
  private readonly backendApiEndpoint = inject(backendEndPointToken);

  // ViewChild references
  @ViewChild('partOfTypeFormRef') partOfTypeFormRef!: DynamicFormsV2Component;
  @ViewChild('parentLocationFormRef') parentLocationFormRef!: DynamicFormsV2Component;
  @ViewChild('generalLocationForm') generalLocationFormRef!: DynamicFormsV2Component;

  // Form metadata
  formMetaData: formMetaData = {
    formName: 'Ward Information',
    formDescription: 'Enter the details of the admission ward location.',
    submitText: 'Save Location',
    showSubmitButton: false
  };

  RoomsAndBedsMetaData: formMetaData = {
    formName: 'Rooms and Beds Information',
    formDescription: 'Enter the details of the rooms and beds in the admission ward location.',
    submitText: 'Save Rooms and Beds',
    showSubmitButton: false
  };

  // Form fields
  formFields: FormFields[] = [];
  locationTypeSlice?: FormFields;
  parentLocationSlice?: FormFields;
  addressSlice: FormFields | null = null;

  RoomsAndBedsFormFields: FormFields[] = [
    <GroupField>{
      generalProperties: {
        fieldApiName: 'rooms',
        fieldName: 'Rooms Information',
        fieldLabel: 'Rooms Information',
        fieldType: 'IndividualField',
        isArray: false,
        isGroup: true
      },
      keys: ['numberOfRooms', 'roomNumberingSystem'],
      groupFields: {
        numberOfRooms: <IndividualField>{
          generalProperties: {
            fieldApiName: 'numberOfRooms',
            fieldName: 'Number of Rooms',
            fieldLabel: 'Number of Rooms',
            fieldType: 'IndividualField',
            inputType: 'number',
            validations: [{ type: 'default', name: 'required' }],
            isArray: false,
            isGroup: false
          }, data: ''
        },
        roomNumberingSystem: <SingleCodeField>{
          generalProperties: {
            fieldApiName: 'roomNumberingSystem',
            fieldName: 'Room Numbering System',
            fieldLabel: 'Room Numbering System',
            fieldType: 'SingleCodeField',
            inputType: 'select',
            validations: [{ type: 'default', name: 'required' }],
            isArray: false,
            isGroup: false
          }, data: ['Numeric (1, 2, 3, ...)', 'Alphabetic (A, B, C, ...)']
        }
      },
    },
    <GroupField>{
      generalProperties: {
        fieldApiName: 'beds',
        fieldName: 'Beds Information',
        fieldLabel: 'Beds Information',
        fieldType: 'IndividualField',
        isArray: false,
        isGroup: true,
      },
      keys: ['numberOfBeds', 'bedNumberingSystem'],
      groupFields: {
        numberOfBeds: <IndividualField>{
          generalProperties: {
            fieldApiName: 'numberOfBeds',
            fieldName: 'Number of Beds',
            fieldLabel: 'Number of Beds',
            fieldType: 'IndividualField',
            inputType: 'number',
            validations: [{ type: 'default', name: 'required' }],
            isArray: false,
            isGroup: false
          }, data: ''
        },
        bedNumberingSystem: <SingleCodeField>{
          generalProperties: {
            fieldApiName: 'bedNumberingSystem',
            fieldName: 'Bed Numbering System',
            fieldLabel: 'Bed Numbering System',
            fieldType: 'SingleCodeField',
            inputType: 'select',
            validations: [{ type: 'default', name: 'required' }],
            isArray: false,
            isGroup: false
          }, data: ['Numeric (1, 2, 3, ...)', 'Alphabetic (A, B, C, ...)']
        }
      }
    }
  ];

  newParentLocationNameForm: FormFields[] = [
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'parentLocationName',
        fieldName: 'Parent Location Name',
        fieldLabel: 'Parent Location Name',
        fieldType: 'IndividualField',
        inputType: 'text',
        validations: [{ type: 'default', name: 'required' }],
        auth: { read: 'all', write: 'doctor, nurse, admin' },
        isArray: false,
        isGroup: false
      },
      data: ''
    }
  ] as FormFields[];

  // Form controls
  addressSameAsHospital = new FormControl(false);
  partOfType: FormControl<any> = new FormControl('');

  // Data properties
  locationsAvailable?: Location[] = [];
  filteredLocations?: Location[];
  hospitalAddress?: Organization['address'];

  wardLocation: Location = {
    address: {},
    resourceType: 'Location',
    name: '',
    status: 'active',

  };

  newParentLocationResourceToSubmit?: Location
  newParentLocationResourceRawValues?: { parentLocationName?: string, partOfType?: { code: string, display: string, system?: string } }
  existingParentLocationReference?: Reference;
  existingParentLocationRawValues?: { partOf?: { code: string, display: string, system?: string } }
  roomLocations: Location[] = [];
  roomLocationsRawValues?: { rooms: { numberOfRooms: string, roomNumberingSystem: string } };
  bedLocations: Location[] = [];
  bedLocationsRawValues?: { beds: { numberOfBeds: string, bedNumberingSystem: string } };
  selectedLocationFieldsToFillForNewParentLocations = ['physicalType', 'status', 'name', 'address'];
  selectedLocationFieldsToFillForRoomAndBedLocations = ['physicalType', 'status', 'name', 'partOf', 'address'];

  // UI state
  loading = true;

  ngAfterViewInit() {
    this.partOfTypeFormRef.ngOnChanges = () => {
      // alert('ngOnChanges called');
    }
  }
  generalFormSlice?: FormFields[];
  ngOnInit(): void {
    forkJoin({
      physicalType: this.selectDataService.getFormFieldSelectData('location', 'physicalType'),
      partOf: this.selectDataService.getFormFieldSelectData('location', 'partOf'),
      location: this.utilityService.getResourceData('Location'),
    }).subscribe({
      next: (resolved) => {
        this.locationsAvailable = resolved.location as Location[];
        this.filteredLocations = this.locationsAvailable;
        this.formFields = this.buildLocationFormFields(resolved.physicalType, resolved.partOf);
        let locationTypeSliceIndex = this.formFields.findIndex(f => f.generalProperties.fieldApiName === 'physicalType');
        this.locationTypeSlice = this.formFields[locationTypeSliceIndex];
        this.generalFormSlice = [...this.formFields]
        this.generalFormSlice.splice(locationTypeSliceIndex, 1);
        let nameIndex = this.generalFormSlice.findIndex(f => f.generalProperties.fieldApiName === 'name');
        this.generalFormSlice[nameIndex].generalProperties.fieldName = 'Ward Name';
        this.generalFormSlice[nameIndex].generalProperties.fieldLabel = 'Ward Name';
        this.generalFormSlice[nameIndex].generalProperties.fieldPlaceholder = 'Enter the name of the ward';
        const parentLocationIndex = this.formFields.findIndex(f => f.generalProperties.fieldApiName === 'partOf');
        if (parentLocationIndex !== -1) {
          this.parentLocationSlice = this.formFields.splice(parentLocationIndex, 1)[0];
          this.generalFormSlice.splice(this.generalFormSlice.findIndex(f => f.generalProperties.fieldApiName === 'partOf'), 1);
          // alert(JSON.stringify(this.formFields))
        }

        this.loading = false;
      },
      error: () => {
        this.errorService.openandCloseError('Unable to load admission-location field options.');
        this.loading = false;
      }
    });

    this.addressSameAsHospital.valueChanges.subscribe(value => {
      // alert(value);
      if (value) {
        const addressIndex = this.generalLocationFormRef.formFields.findIndex(f => f.generalProperties.fieldApiName === 'address');

        if (addressIndex > -1) {
          const unreferencedCloned = [...this.generalLocationFormRef.formFields];
          this.addressSlice = unreferencedCloned.splice(addressIndex, 1)[0];
          this.generalLocationFormRef.formFields = unreferencedCloned;
        }
        this.wardLocation.address = {}
      } else {
        if (this.addressSlice) {
          const unreferencedCloned = [...this.generalLocationFormRef.formFields];
          unreferencedCloned.splice(2, 0, this.addressSlice);
          this.generalLocationFormRef.formFields = unreferencedCloned;
          this.generalLocationFormRef.onEveryChange.emit(this.generalLocationFormRef.aForm.value);
          this.cdk.detectChanges();
        }
      }
    });

    this.partOfType.valueChanges.subscribe((value: string | null) => {
      if (value && this.locationsAvailable) {
        this.filteredLocations = this.utilityService.filterResourceByACodeableConceptfield(this.locationsAvailable, 'physicalType', value) as Location[];
      } else {
        this.filteredLocations = this.locationsAvailable;
      }
      this.parentLocationSlice!.data = this.filteredLocations!.map(loc => ({
        display: loc.name || 'Unnamed Location',
        reference: `Location/${loc.id}`
      }));
      this.parentLocationFormRef.formFields = this.parentLocationSlice ? [this.parentLocationSlice] : [];
      this.cdk.detectChanges();
    });
  }

  setPartOfTypeValue(value: any) {
    if (typeof value === 'string') {
      this.partOfType.setValue(value.split('$#$').length > 2 ? {
        code: value.split('$#$')[0],
        display: value.split('$#$')[1],
        system: value.split('$#$')[2]
      } : {
        code: value,
        display: value,
        system: this.backendApiEndpoint
      });
      return;
    }
    this.partOfType.setValue(value);
  }

  onPartOfTypeChange(event: any) {
    const value = event['physicalType'];
    this.setPartOfTypeValue(value);
  }
  prefersExistingParentLocation = true;
  onParentLocationChange(value: any) {
    // Implementation pending
    this.existingParentLocationReference = value.partOf;
    this.newParentLocationResourceRawValues = undefined;

  }

  onNewParentLocationNameChange(value: any) {
    // Implementation pending
    this.newParentLocationResourceRawValues = {
      ...this.newParentLocationResourceRawValues ?? {},
      parentLocationName: value.parentLocationName,
      partOfType: this.partOfType.value
    }
    this.existingParentLocationReference = undefined;
  }

  processingForm(values: any) {
    if (this.addressSameAsHospital.value && this.hospitalAddress) {
      this.wardLocation.address = this.hospitalAddress[0];
    }
  }

  onRoomsAndBedsFormValuesChange(values: any) {
    this.roomLocationsRawValues = {
      rooms: values.rooms
    };
    this.bedLocationsRawValues = {
      beds: values.beds
    };
  }

  private buildLocationFormFields(
    physicalTypeConcept: string[] | { code: string, display: string, system?: string }[],
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
          validations: [{ type: 'default', name: 'required', isFunction: false }],
          auth: { read: 'all', write: 'doctor, nurse, admin' },
          isArray: false,
          isGroup: false,

        },
        data: physicalTypeConcept
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
              isArray: false,
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
    ];
  }

  onRoomsAndBedsFormChange(values: { rooms: { numberOfRooms: string, roomNumberingSystem: string }, beds: { numberOfBeds: string, bedNumberingSystem: string } }) {
    this.roomLocationsRawValues = {
      rooms: values.rooms
    };
    this.bedLocationsRawValues = {
      beds: values.beds
    };
  }


  crazyAi() {
    //validation
    if (!this.roomLocationsRawValues || !this.bedLocationsRawValues) {
      throw new Error('Room or Bed details are missing.');
    }
    if (!this.roomLocationsRawValues?.rooms || !this.bedLocationsRawValues?.beds) {
      throw new Error('Room or Bed details are missing.');
    }
    if (!this.roomLocationsRawValues.rooms.numberOfRooms || !this.roomLocationsRawValues.rooms.roomNumberingSystem) {
      throw new Error('Room details are missing.');
    }
    if (!this.bedLocationsRawValues.beds.numberOfBeds || !this.bedLocationsRawValues.beds.bedNumberingSystem) {
      throw new Error('Bed details are missing.');
    }

    // Generate room and bed l//ocations
    if (this.roomLocationsRawValues?.rooms) {
      this.roomLocations = this.generateRoomLocations(
        this.roomLocationsRawValues.rooms.numberOfRooms,
        this.roomLocationsRawValues.rooms.roomNumberingSystem
      );
    } else {
      throw new Error('Room details are missing.');
    }

    if (this.bedLocationsRawValues?.beds) {
      this.bedLocations = this.generateBedLocations(
        this.bedLocationsRawValues.beds.numberOfBeds,
        this.bedLocationsRawValues.beds.bedNumberingSystem
      );
    } else {
      throw new Error('Bed details are missing.');
    }
  }

  /**
   * Generate room names based on count and numbering system
   */
  private generateRoomNames(count: number, numberingSystem: string): string[] {
    const isNumeric = numberingSystem.includes('Numeric');
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      if (isNumeric) {
        names.push(`Room ${i + 1}`);
      } else {
        // Alphabetic: A, B, C, ... Z, AA, AB, etc.
        names.push(`Room ${this.numberToLetters(i)}`);
      }
    }

    return names;
  }

  /**
   * Generate bed names based on count and numbering system
   */
  private generateBedNames(count: number, numberingSystem: string): string[] {
    const isNumeric = numberingSystem.includes('Numeric');
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      if (isNumeric) {
        names.push(`Bed ${i + 1}`);
      } else {
        names.push(`Bed ${this.numberToLetters(i)}`);
      }
    }

    return names;
  }

  /**
   * Convert number to letters (0 → A, 1 → B, 25 → Z, 26 → AA, etc.)
   */
  private numberToLetters(num: number): string {
    let letters = '';
    let n = num;

    while (n >= 0) {
      letters = String.fromCharCode(65 + (n % 26)) + letters;
      n = Math.floor(n / 26) - 1;
      if (n < 0) break;
    }

    return letters;
  }

  /**
   * Generate Location resources for rooms
   */
  private generateRoomLocations(count: string, numberingSystem: string): Location[] {
    const roomCount = parseInt(count, 10);
    if (isNaN(roomCount) || roomCount <= 0) throw new Error('Invalid room count.');

    const roomNames = this.generateRoomNames(roomCount, numberingSystem);
    const parentLocationRef: Reference | undefined = this.existingParentLocationReference
      ? this.existingParentLocationReference
      : undefined;

    return roomNames.map(name => ({
      resourceType: 'Location',
      name,
      // status: 'active',
      physicalType: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
          code: 'ro',
          display: 'Room'
        }]
      },
      // // partOf: parentLocationRef,
      // address: this.addressSameAsHospital.value && this.hospitalAddress
      //   ? this.hospitalAddress[0]
      //   : this.wardLocation.address
    }));
  }

  /**
   * Generate Location resources for beds
   */
  private generateBedLocations(count: string, numberingSystem: string): Location[] {
    const bedCount = parseInt(count, 10);
    if (isNaN(bedCount) || bedCount <= 0) return [];

    const bedNames = this.generateBedNames(bedCount, numberingSystem);
    const parentLocationRef: Reference | undefined = this.existingParentLocationReference
      ? this.existingParentLocationReference
      : undefined;

    return bedNames.map(name => ({
      resourceType: 'Location',
      name,
      // status: 'active',
      physicalType: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
          code: 'bd',
          display: 'Bed'
        }]
      },
      // // partOf: parentLocationRef,
      // address: this.addressSameAsHospital.value && this.hospitalAddress
      //   ? this.hospitalAddress[0]
      //   : this.wardLocation.address
    }));


    // ...existing code...


  }
  fhirResourceTransformService = inject(FhirResourceTransformService);
  onGeneralLocationFormChange(event: any) {
    // Handle changes from the general location form
    console.log('General Location Form Change:', event);
    // alert(JSON.stringify(event));
    if (!this.addressSameAsHospital.value) {
      this.wardLocation.address = event.address;
    }
    this.wardLocation.name = event.name;
    this.wardLocation.status = event.status;



  }

  beforeFinalSubmission() {
    // Submit new parent first if there is one and get its id as reference
    if (this.newParentLocationResourceRawValues) {
      this.newParentLocationResourceToSubmit = {
        resourceType: 'Location',
        name: this.newParentLocationResourceRawValues?.parentLocationName || 'Unnamed Location',
        physicalType: this.newParentLocationResourceRawValues?.partOfType ? {
          coding: [{
            code: this.newParentLocationResourceRawValues.partOfType.code,
            display: this.newParentLocationResourceRawValues.partOfType.display,
            system: this.newParentLocationResourceRawValues.partOfType.system || this.backendApiEndpoint
          }],
          text: this.newParentLocationResourceRawValues.partOfType.display
        } : undefined,
      }

      if (this.wardLocation.address) {
        this.newParentLocationResourceToSubmit.address = this.wardLocation.address;
      }
      if (this.wardLocation.status) {
        this.newParentLocationResourceToSubmit.status = this.wardLocation.status;
      }

      this.fhirResourceService.postResource('Location', this.newParentLocationResourceToSubmit).pipe(
        switchMap((parentResult: any) => {
          // Set ward's partOf reference to the newly created parent
          this.wardLocation.partOf = {
            reference: `Location/${parentResult.resource.id}`,
            display: parentResult.resource.name
          };

          // Post ward location
          return this.fhirResourceService.postResource('Location', this.wardLocation);
        }),
        switchMap((wardResult: any) => {
          // Generate room and bed locations
          this.crazyAi();

          // Build bundle with rooms only
          const roomBundle: Bundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            entry: this.roomLocations.map(roomLoc => ({
              resource: {
                ...roomLoc,
                partOf: {
                  reference: `Location/${wardResult.resource.id}`,
                  display: wardResult.resource.name
                },
                status: this.wardLocation.status,
                address: this.wardLocation.address
              },
              request: {
                method: 'POST',
                url: 'Location'
              }
            } as BundleEntry))
          };

          // Post rooms and pass ward result forward
          return this.fhirResourceService.postBundle(roomBundle).pipe(
            map(roomBundleResult => ({ wardResult, roomBundleResult }))
          );
        }),
        switchMap(({ wardResult, roomBundleResult }) => {
          // Extract created room IDs from bundle response
          const createdRooms = roomBundleResult.bundle.entry?.map((entry: any, index: number) => ({
            id: entry.resource?.id,
            name: entry.resource?.id || this.roomLocations[index].name
          })) || [];

          // Create ALL beds for EACH room (not distributed, duplicated)
          const allBedEntries: BundleEntry[] = [];

          createdRooms.forEach((room: any) => {
            this.bedLocations.forEach((bedLoc, bedIndex) => {
              allBedEntries.push({
                resource: {
                  ...bedLoc,
                  name: `${bedLoc.name} (${room.name})`, // Add room name to bed name for uniqueness
                  partOf: {
                    reference: `Location/${room.id}`,
                    display: room.name
                  },
                  status: this.wardLocation.status,
                  address: this.wardLocation.address
                },
                request: {
                  method: 'POST',
                  url: 'Location'
                }
              } as BundleEntry);
            });
          });

          const bedBundle: Bundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            entry: allBedEntries
          };

          // Post beds with room references
          return this.fhirResourceService.postBundle(bedBundle).pipe(
            map(bedBundleResult => ({ createdRooms, bedBundleResult }))
          );
        })
      ).subscribe({
        next: ({ createdRooms, bedBundleResult }) => {
          const roomCount = createdRooms.length;
          const bedCount = bedBundleResult.bundle.entry?.length || 0;
          const bedsPerRoom = this.bedLocations.length;
          this.errorService.openandCloseError(
            `Ward created with ${roomCount} rooms and ${bedCount} total beds (${bedsPerRoom} beds per room)!`
          );
          this.submitting = false;
        },
        error: (err) => {
          this.errorService.openandCloseError('Failed to create locations: ' + (err.message || 'Unknown error'));
          this.submitting = false;
        }
      });
    } else if (!this.newParentLocationResourceRawValues && !this.existingParentLocationReference) {
      this.errorService.openandCloseError('Please select or create a parent location.');
      this.submitting = false;
    } else {
      // Use existing parent location reference
      this.wardLocation.partOf = this.existingParentLocationReference;

      this.fhirResourceService.postResource('Location', this.wardLocation).pipe(
        switchMap((wardResult: any) => {
          this.crazyAi();

          // Build bundle with rooms only
          const roomBundle: Bundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            entry: this.roomLocations.map(roomLoc => ({
              resource: {
                ...roomLoc,
                partOf: {
                  reference: `Location/${wardResult.resource.id}`,
                  display: wardResult.resource.name
                },
                status: this.wardLocation.status,
                address: this.wardLocation.address
              },
              request: { method: 'POST', url: 'Location' }
            } as BundleEntry))
          };

          // Post rooms first
          return this.fhirResourceService.postBundle(roomBundle).pipe(
            map(roomBundleResult => ({ wardResult, roomBundleResult }))
          );
        }),
        switchMap(({ wardResult, roomBundleResult }) => {
          // Extract created room IDs from bundle response
          const createdRooms = roomBundleResult.bundle.entry?.map((entry: any, index: number) => ({
            id: entry.response?.location?.split('/').pop() || entry.resource?.id,
            name: this.roomLocations[index].name
          })) || [];

          // Create ALL beds for EACH room (duplicated for each room)
          const allBedEntries: BundleEntry[] = [];

          createdRooms.forEach(room => {
            this.bedLocations.forEach((bedLoc) => {
              allBedEntries.push({
                resource: {
                  ...bedLoc,
                  name: `${bedLoc.name}`, // Add room name to bed name for uniqueness
                  partOf: {
                    reference: `Location/${room.id}`,
                    display: room.name
                  },
                  status: this.wardLocation.status,
                  address: this.wardLocation.address
                },
                request: { method: 'POST', url: 'Location' }
              } as BundleEntry);
            });
          });

          const bedBundle: Bundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            entry: allBedEntries
          };

          // Post beds after rooms are created
          return this.fhirResourceService.postBundle(bedBundle).pipe(
            map(bedBundleResult => ({ createdRooms, bedBundleResult }))
          );
        })
      ).subscribe({
        next: ({ createdRooms, bedBundleResult }) => {
          const roomCount = createdRooms.length;
          const totalBeds = bedBundleResult.bundle.entry?.length || 0;
          const bedsPerRoom = this.bedLocations.length;
          this.errorService.openandCloseError(
            `Ward created with ${roomCount} rooms and ${totalBeds} total beds (${bedsPerRoom} beds per room)!`
          );
          this.submitting = false;
        },
        error: (err) => {
          this.errorService.openandCloseError('Failed to create locations: ' + (err.message || 'Unknown error'));
          this.submitting = false;
        }
      });
    }
  }
  submitting = false;
  isUniqueNameAndType(name: string, physicalType: Location['physicalType']) {
    if (this.locationsAvailable?.find(loc => {
      return loc.name === name && (loc.physicalType?.coding?.some(c => {
        return (c.code === physicalType?.coding?.[0].code &&
          c.display === physicalType?.coding?.[0].display)
      }) ||
        loc.physicalType?.text === physicalType?.text)
    })) {
      return false;
    }
    return true;
  }
  onSubmitAdmissionLocation() {
    this.submitting = true;
    //NO NAME?
    if (!this.wardLocation.name) {
      this.errorService.openandCloseError('Ward name is required.');
      this.submitting = false;
      return;
    }

    this.wardLocation.physicalType = this.locationTypeSlice?.data.find((pt: any) => {
      if (typeof pt === 'string') {
        return pt.trim().toLowerCase() === 'ward';
      } else if (typeof pt === 'object' && pt.display) {
        return pt.display.trim().toLowerCase() === 'ward';
      } else return ''
    });
    // alert(JSON.stringify(this.wardLocation));
    this.wardLocation = this.fhirResourceTransformService.transformValues('Location', this.wardLocation) as Location;
    if (this.locationsAvailable?.find(loc => {
      return loc.name === this.wardLocation.name && (loc.physicalType?.coding?.some(c => {
        return (c.code === this.wardLocation.physicalType?.coding?.[0].code &&
          c.display === this.wardLocation.physicalType?.coding?.[0].display)
      }) ||
        loc.physicalType?.text === this.wardLocation.physicalType?.text) && loc.status === 'active';
    })


    ) {
      this.errorService.openandCloseError('A ward with the same name and type already exists. Please choose a different name.');
      this.submitting = false;
      return;
    }
    // alert(Object.keys(this.wardLocation.address || {}).some(e => this.wardLocation.address?.[e as keyof typeof this.wardLocation.address] !== undefined));
    if (!Object.keys(this.wardLocation.address || {}).some(e => this.wardLocation.address?.[e as keyof typeof this.wardLocation.address] !== undefined)) {
      delete this.wardLocation.address;
    }
    // alert(JSON.stringify(this.wardLocation));
    // this.submitting = false;
    // return;
    this.beforeFinalSubmission();

  }
  fhirResourceService = inject(FhirResourceService);

}
