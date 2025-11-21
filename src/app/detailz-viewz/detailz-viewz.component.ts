import { Component, inject, Input, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { DetailsBuilderService, DetailsBuilderObject } from './details-builder.service';
import { Resource } from 'fhir/r4b';
 import { JsonPipe, TitleCasePipe } from '@angular/common';
// import { Component, EventEmitter, inject, Inject, Input, Optional, Output, resource } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Bundle, ChargeItemDefinition, InventoryItem, Organization, Specimen } from 'fhir/r5';


// hi, copilot remove the first ../ fro the below link
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { commonImports } from '../shared/table-interface';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
import { SpecialHeaderComponent } from "../shared/special-header/special-header.component";
// import { HttpClient } from '@angular/common';
import { forkJoin, map, Observable } from 'rxjs';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ReferenceDisplayComponent } from "../shared/reference-display/reference-display.component";
import { DetailsCardzComponent } from '../details-cardz/details-cardz.component';

import { UtilityService } from '../shared/utility.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { RESOURCE_PROPERTY_TYPES } from '../shared/fhir-resource-transform.service';
import { NaPipe } from "../shared/na.pipe";
import { SpecialHeaderV2Component } from '../special-header-v2/special-header-v2.component';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';

export const RESOURCE_KEY_LABELS: Record<string, Record<string, string>> = {
  MedicationRequest: {
    status: 'Status',
    intent: 'Intent',
    priority: 'Priority',
    category: 'Category',
    subject: 'Patient',
    requester: 'Requester',
    performer: 'Performer',
    performerType: 'Performer Type',
    medicationCodeableConcept: 'Medication',
    medicationReference: 'Medication Reference',
    dosageInstruction: 'Dosage Instructions',
    reasonCode: 'Reason Code',
    authoredOn: 'Authored On',
    dispenseRequest: 'Dispense Request',
    substitution: 'Substitution',
    groupIdentifier: 'Group Identifier',
    'dosageInstruction.text': 'Dosage Instructions (Text)',
    'dosageInstruction.additionalInstruction': 'Additional Instructions',
    'dosageInstruction.patientInstruction': 'Patient Instructions',
    'dosageInstruction.timing': 'Timing',
    'dosageInstruction.route': 'Route',
    'dosageInstruction.method': 'Method',
    'dosageInstruction.doseAndRate': 'Dose & Rate'
  },
  ServiceRequest: {
    status: 'Status',
    intent: 'Intent',
    priority: 'Priority',
    category: 'Category',
    subject: 'Patient',
    requester: 'Requester',
    performer: 'Performer',
    performerType: 'Performer Type',
    code: 'Service Code',
    reasonCode: 'Reason Code',
    authoredOn: 'Authored On',
    identifier: 'Identifier',
    specimen: 'Specimen',
    'orderDetail.parameterCodeableConcept': 'Order Detail Code',
    'orderDetail.parameterString': 'Order Detail Notes',
    'orderDetail.parameterQuantity': 'Order Detail Quantity'
  },
  Specimen: {
    status: 'Status',
    type: 'Specimen Type',
    subject: 'Subject',
    request: 'Associated Request',
    collection: 'Collection Details',
    'collection.collector': 'Collected By',
    'collection.collectedDateTime': 'Collection Time',
    'collection.bodySite': 'Collection Site',
    'collection.method': 'Collection Method',
    'collection.quantity': 'Collection Quantity',
    receivedTime: 'Received Time',
    condition: 'Condition',
    bodySite: 'Body Site',
    note: 'Notes'
  },
  Observation: {
    status: 'Status',
    category: 'Category',
    code: 'Observation Code',
    subject: 'Subject',
    encounter: 'Encounter',
    effectiveDateTime: 'Effective Time',
    valueQuantity: 'Value (Quantity)',
    valueString: 'Value (Text)',
    performer: 'Performer',
    interpretation: 'Interpretation',
    referenceRange: 'Reference Range',
    specimen: 'Specimen',
    'component.code': 'Component Code',
    'component.valueQuantity': 'Component Value',
    'component.valueString': 'Component Value (Text)',
    'component.valueCodeableConcept': 'Component Concept',
    'component.interpretation': 'Component Interpretation'
  },
  Condition: {
    clinicalStatus: 'Clinical Status',
    verificationStatus: 'Verification Status',
    category: 'Category',
    severity: 'Severity',
    code: 'Diagnosis Code',
    subject: 'Patient',
    encounter: 'Encounter',
    onsetDateTime: 'Onset Date',
    abatementDateTime: 'Abatement Date',
    recordedDate: 'Recorded Date',
    asserter: 'Asserter',
    note: 'Notes',
    'stage.summary': 'Stage Summary',
    'stage.assessment': 'Stage Assessment',
    'stage.type': 'Stage Type'
  },
  Medication: {
    code: 'Medication Code',
    status: 'Status',
    manufacturer: 'Manufacturer',
    form: 'Form',
    amount: 'Amount',
    ingredient: 'Ingredients'
  },
  MedicationDispense: {
    status: 'Status',
    medicationCodeableConcept: 'Medication',
    subject: 'Patient',
    performer: 'Dispenser',
    authorizingPrescription: 'Authorizing Prescription',
    quantity: 'Quantity',
    whenHandedOver: 'Handed Over',
    dosageInstruction: 'Dosage Instructions'
  },
  MedicationAdministration: {
    status: 'Status',
    medicationCodeableConcept: 'Medication',
    subject: 'Patient',
    performer: 'Performer',
    encounter: 'Encounter',
    effectiveDateTime: 'Effective Time',
    dosage: 'Dosage',
    reasonCode: 'Reason',
    note: 'Notes'
  }
};

export interface DetailActionButton {
  key: string;
  label?: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  capabilities?: Array<{ resource: keyof typeof capacityObject; action: string }>;
}

@Component({
  selector: 'app-detailz-viewz',
  imports: [MatCardModule,
    JsonPipe, SpecialHeaderV2Component, ReferenceDisplayDirective,
    TitleCasePipe, MatIconModule, MatDividerModule, TabledOptionComponent,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent, NaPipe],
  templateUrl: './detailz-viewz.component.html',
  styleUrls: ['../cardz-details-check/cardz-details-check.component.scss','./detailz-viewz.component.scss']   
})
export class DetailzViewzComponent implements OnInit {
  resourceKeyLabels = RESOURCE_KEY_LABELS;
  detailsBuilderService = inject(DetailsBuilderService);
  dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as {
    resourceData?: Resource;
    detailsBuilderObject?: DetailsBuilderObject;
    excludeKeys?: string[];
    showOnlyKeysWithValues?: boolean;
    actionButtons?: DetailActionButton[];
  } | null;

  keyVsResourceType = RESOURCE_PROPERTY_TYPES;
  @Input() resourceData?: Resource;
  @Input() detailsBuilderObject?: DetailsBuilderObject;
  @Input() excludeKeys?: string[];
  @Input() showOnlyKeysWithValues = false;
  @Input() actionButtons?: DetailActionButton[];
  @Output() actionInvoked = new EventEmitter<{ key: string; resource?: Resource }>();

  refinedResourceData: Record<string, any> | null = null;
  private auth = inject(AuthService);

  ngOnInit(): void {
    if (!this.resourceData && this.dialogData?.resourceData) {
      this.resourceData = this.dialogData.resourceData;
    }
    if (!this.detailsBuilderObject && this.dialogData?.detailsBuilderObject) {
      this.detailsBuilderObject = this.dialogData.detailsBuilderObject;
    }
    if (!this.excludeKeys && this.dialogData?.excludeKeys) {
      this.excludeKeys = this.dialogData.excludeKeys;
    }
    if (this.dialogData?.showOnlyKeysWithValues !== undefined) {
      this.showOnlyKeysWithValues = this.dialogData.showOnlyKeysWithValues;
    }
    if (!this.actionButtons && this.dialogData?.actionButtons) {
      this.actionButtons = this.dialogData.actionButtons;
    }
    this.buildRefinedResource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('resourceData' in changes || 'detailsBuilderObject' in changes) {
      this.buildRefinedResource();
    }
  }

  private buildRefinedResource(): void {
    if (!this.resourceData?.resourceType) {
      this.refinedResourceData = null;
      return;
    }
    const { resourceType, ...payload } = this.resourceData as Resource & Record<string, any>;
    const refined = this.detailsBuilderService.stringifyResource(resourceType, payload);
    this.refinedResourceData = this.applyDisplayFilters(refined);
  }

  private applyDisplayFilters(data: Record<string, any> | null): Record<string, any> | null {
    if (!data) return null;
    const filtered: Record<string, any> = {};
    const excludes = (this.excludeKeys || []).map(k => k.toLowerCase());

    Object.entries(data).forEach(([key, value]) => {
      if (excludes.includes(key.toLowerCase())) return;
      if (this.showOnlyKeysWithValues) {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
          return;
        }
      }
      filtered[key] = value;
    });

    return filtered;
  }

  canShowAction(button: DetailActionButton): boolean {
    if (!button?.capabilities || !button.capabilities.length) return true;
    return button.capabilities.some(cap => this.auth.can(cap.resource, cap.action));
  }

  triggerAction(button: DetailActionButton): void {
    this.actionInvoked.emit({ key: button.key, resource: this.resourceData });
  }

  isBackboneField(field: string): boolean {
    const typeMap = this.keyVsResourceType[this.resourceData?.resourceType || ''];
    const entry = typeMap?.[field];
    return !!entry && typeof entry === 'object' && 'kind' in entry && entry.kind === 'BackboneElement';
  }

  isReferenceField(field: string): boolean {
    const typeMap = this.keyVsResourceType[this.resourceData?.resourceType || ''];
    return (typeMap?.[field] === 'Reference');
  }

  getReferenceValue(field: string): any {
    const value = (this.resourceData as any)?.[field];
    if (value?.reference) {
      return value.reference;
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  }

  explainFilteredResponse(): string {
    return 'The previous response was blocked by the platform’s safety filters.';
  }
}

// @Component({
//   selector: 'app-cardz-details-dialog',
//   imports: [MatCardModule,
//     JsonPipe,
//     TitleCasePipe, MatIconModule, MatDividerModule, TabledOptionComponent,
//     DetailsCardzComponent,
//     DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
//   templateUrl: './dialog.component.html',
//   styleUrl: './cardz-details-check.component.scss'
// })
// export class CardzDetailsDialog {

//   constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

//   }
//   detailsBuilderObject = {
//     resourceName: "Low Supply Detail",
//     resourceIcon: 'inventory_2',
//     specialHeader: {
//       specialHeaderKey: 'code',
//       specialHeaderIcon: 'inventory_2',
//       specialHeaderDataType: 'CodeableConcept',
//       ReferenceDeepPath: null, // ['name', '0'].join('$#$');
//       valueDeepPath: null,

//     },
//     groups: [{
//       groupName: 'Details',
//       groupIcon: 'info',
//       groupMembers: [

//         //name
//         {
//           key: 'code',
//           label: 'Name',
//           keyDataType: 'string',
//           referenceDeepPath: null,
//           valueDeepPath: ['coding', '0', 'display'].join('$#$'),
//         },
//         //alias
//         {
//           key: 'category',
//           label: 'Category',
//           keyDataType: 'CodeableConcept',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },
//         {
//           key: 'netContent',
//           label: 'In Stock',
//           keyDataType: 'number',
//           referenceDeepPath: null,
//           valueDeepPath: ['value'].join('$#$'),
//         },
//         {
//           key: 'baseUnit',
//           label: 'Base Unit',
//           keyDataType: 'CodeableConcept',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },

//         {
//           key: 'inStockStatus',
//           label: 'Quantity in Stock',
//           keyDataType: 'IndividualField',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },

//       ]
//     }]
//   };

//   encounterService = inject(EncounterServiceService);
//   takeStock(type: string) {
//     if (type.trim().toLowerCase() === 'medication') {
//       this.encounterService.addMedStock();
//     } else {
//       this.encounterService.addInventory();

//     }
//   }
// }

// import { JsonPipe, TitleCasePipe } from '@angular/common';
// import { Component, EventEmitter, inject, Inject, Input, Optional, Output, resource } from '@angular/core';
// import { MatCard, MatCardModule } from '@angular/material/card';
// import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { Bundle, ChargeItemDefinition, InventoryItem, Organization, Specimen } from 'fhir/r5';


// // hi, copilot remove the first ../ fro the below link
// import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
// import { commonImports } from '../shared/table-interface';
// import { LinkInReferencesService } from '../shared/link-in-references.service';
// import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
// import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
// import { SpecialHeaderComponent } from "../shared/special-header/special-header.component";
// import { HttpClient } from '@angular/common';
// import { forkJoin, map, Observable } from 'rxjs';
// import { baseStatusStyles } from '../shared/statusUIIcons';
// import { ReferenceDisplayComponent } from "../shared/reference-display/reference-display.component";
// import { DetailsCardzComponent } from '../details-cardz/details-cardz.component';

// import { UtilityService } from '../shared/utility.service';
// import { ActivatedRoute } from '@angular/router';
// import { AuthService, capacityObject } from '../shared/auth/auth.service';
// import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
// import { fieldType } from '../shared/dynamic-forms.interface2';
// import { TabledOptionComponent } from '../tabled-option/tabled-option.component';


// @Component({
//   selector: 'app-cardz-details-check',
//   imports: [MatCardModule,
//     JsonPipe,
//     TitleCasePipe, MatIconModule, MatDividerModule, TabledOptionComponent,
//     DetailsCardzComponent,
//     DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
//   templateUrl: './cardz-details-check.component.html',
//   styleUrls: ['./cardz-details-check.component.scss']
// })
// export class DetailzViewzComponent {

// }