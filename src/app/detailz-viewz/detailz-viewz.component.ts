import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';
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
    groupIdentifier: 'Group Identifier'
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
    specimen: 'Specimen'
  }
};

@Component({
  selector: 'app-detailz-viewz',
  imports: [MatCardModule,
    JsonPipe, SpecialHeaderV2Component,
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
  } | null;

  keyVsResourceType = RESOURCE_PROPERTY_TYPES;
  @Input() resourceData?: Resource;
  @Input() detailsBuilderObject?: DetailsBuilderObject;

  refinedResourceData: Record<string, any> | null = null;

  ngOnInit(): void {
    if (!this.resourceData && this.dialogData?.resourceData) {
      this.resourceData = this.dialogData.resourceData;
      console.log(this.resourceData)
    }
    if (!this.detailsBuilderObject && this.dialogData?.detailsBuilderObject) {
      this.detailsBuilderObject = this.dialogData.detailsBuilderObject;
      console.log(this.detailsBuilderObject);
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
    this.refinedResourceData = this.detailsBuilderService.stringifyResource(
      resourceType,
      payload
      
    );
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
// import { HttpClient } from '@angular/common/http';
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