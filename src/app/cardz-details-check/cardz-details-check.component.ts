import { JsonPipe, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, inject, Inject, Input, Optional, Output, resource } from '@angular/core';
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


@Component({
  selector: 'app-cardz-details-check',
  imports: [MatCardModule,
    JsonPipe,
    TitleCasePipe, MatIconModule, MatDividerModule, TabledOptionComponent,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
  templateUrl: './cardz-details-check.component.html',
  styleUrl: './cardz-details-check.component.scss'
})
export class CardzDetailsCheckComponent {
  @Input() resourceType = "lab-supply";
  http = inject(HttpClient);
  @Output() loaded = new EventEmitter<boolean>();

  //  http = inject(HttpClient);
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['category', {
      dataType: "CodeableConceptField",
      columnName: "Category"
    }],

    ['baseUnit', {
      dataType: "CodeableConceptField",
      columnName: "Unit of Measure"
    }],
    ['netContent.value', {
      dataType: "IndividualField",
      columnName: "In Stock"
    }],
    ['code', {
      dataType: "CodeableConceptField",

      columnName: "Name"
    }],




    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    columnMetaData2: new Map([['category', {
      dataType: "CodeableConceptField",
      columnName: "Category"
    }],

    ['baseUnit', {
      dataType: "IndividualField",
      columnName: "Unit of Measure"
    }],
    ['inStockStatus', {
      dataType: "IndividualField",
      columnName: "In Stock"
    }],
    ['code', {
      dataType: "CodeableConceptField",

      columnName: "Name"
    }],




    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['category', 'code', 'netContent.value', 'baseUnit',],
    columns2: ['code', 'inStockStatus',],
  }

  ngOnInit() {
    const url = this.resourceType == "lab-supply" ? "/iitem.json" : "";
    let request$ = new Observable();

    if (this.resourceType == "lab-supply") {
      request$ = this.http.get(url).pipe(map((e: any) => {
        if (this.resourceType == "lab-supply") {
          return {
            ...e, entry: e.entry.filter((f: any) => {
              return f.resource.netContent && f.resource.netContent.value && f.resource.netContent.value < 10
            })
          }

        } else {
          return e;
        }
      }))
    } else {
      request$ = forkJoin(
        {
          medicine: this.http.get<Bundle<any>>("https://hapi.fhir.org/baseR5/Medication?_format=json&_count=100"),
          chargeItemDef: this.http.get<Bundle<ChargeItemDefinition>>("https://hapi.fhir.org/baseR5/ChargeItemDefinition?_format=json&_count=20"),
          InventoryItem: this.http.get<Bundle<InventoryItem>>("https://server.fire.ly/r5/InventoryItem?_format=json&_count=20")

        }
      ).pipe(
        map((e: { medicine: Bundle<any>, chargeItemDef: Bundle<ChargeItemDefinition>, InventoryItem: Bundle<InventoryItem> }) => {
          if (e.medicine.entry && e.chargeItemDef.entry) {
            e.medicine.entry = e.medicine.entry.filter((g: any) => {
              return g.resource.hasOwnProperty('code') && g.resource.hasOwnProperty('status')
              // &&
              // g.resource.hasOwnProperty('batch') && 
              // g.resource.hasOwnProperty('ingredient') &&
              // g.resource.batch.hasOwnProperty('expirationDate') &&
              // g.resource.hasOwnProperty('doseForm')
            }).map((f: any, index: number) => {
              // if( e.chargeItemDef.entry && e.chargeItemDef.entry[index]?.resource?.hasOwnProperty('unitPrice')) {
              const actualAmount = e.chargeItemDef.entry?.[index]?.resource?.propertyGroup?.[0]?.priceComponent?.[0]?.amount?.value || '6,000.00';
              const currency = e.chargeItemDef.entry?.[index]?.resource?.propertyGroup?.[0]?.priceComponent?.[0]?.amount?.currency || 'NGN';
              const unitPrice = currency + ' ' + actualAmount;

              // do for inventory too - quantity in Stock
              //net content + base Unit
              let netContent: number | string = e.InventoryItem.entry?.[index]?.resource?.netContent?.value || 0;
              const baseUnit = e.InventoryItem.entry?.[index]?.resource?.netContent?.unit || 'mg';

              let inStockStatus = netContent === 0 ? "out of stock" : netContent + ' ' + baseUnit;


              return { ...f, resource: { ...f.resource, unitPrice, inStockStatus } };

            }
              // else{

              // }
            );
          }
          return e.medicine;
        })
      )
    }



    request$.subscribe((e: any) => {
      this.loaded.emit(true);
      console.log(e)
      this.testingTabeledOption.rawTableData = e;

    })
  }









  detailsBuilderObject_former = {
    resourceName: 'Hospital',
    resourceIcon: 'local_hospital',
    specialHeader: {
      specialHeaderKey: 'name',
      specialHeaderIcon: 'local_hospital',
      specialHeaderDataType: 'string',
      ReferenceDeepPath: null, // ['name', '0'].join('$#$');
      valueDeepPath: null,

    },
    //check fhir 5 serviceRequest Resource and give me appropriate builderOject properties
    groups: [{
      groupName: 'Contact',
      groupIcon: 'contact_phone',
      groupMembers: [

        {
          key: 'contact',
          label: 'Address Summary',
          keyDataType: 'string',
          referenceDeepPath: null,// [['0', 'address', '0', 'text'].join('$
          valueDeepPath: [['0', 'address', 'text'].join('$#$')],
        },
        {
          key: 'contact',
          label: 'Street Address',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: [['0', 'address', 'line'].join('$#$')],
        },
        {
          key: 'contact',
          label: 'City',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: [['0', 'address', 'city'].join('$#$')],
        },
        {
          key: 'contact',
          label: 'State',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: [['0', 'address', 'state'].join('$#$')],
        },
        {
          key: 'contact',
          label: 'Postal Code',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: [['0', 'address', 'postalCode'].join('$#$')],
        },
        {
          key: 'contact',
          label: 'Country',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: [['0', 'address', 'country'].join('$#$')],

        }
      ]
    },
    //group for desc, tyoe and qualification.code - codeableconcept
    {
      groupName: 'Details',
      groupIcon: 'info',
      groupMembers: [
        {
          key: 'id',
          label: 'ID',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: null,
        },
        //name
        {
          key: 'name',
          label: 'Name',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: null,
        },
        //alias
        {
          key: 'alias',
          label: 'Alias',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: ['0'].join('$#$'),
        },
        {
          key: 'telecom',
          label: 'Contact Number',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: ['0', 'telecom', '0', 'value'].join('$#$'),
        },
        {
          key: 'telecom',
          label: 'Email',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: ['0', 'telecom', '1', 'value'].join('$#$'),

        },
        {
          key: 'type',
          label: 'Type',
          keyDataType: 'CodeableConcept',
          referenceDeepPath: null,
          valueDeepPath: [0]
        },
        {
          key: 'description',
          label: 'Description',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: null,
        },
        {
          key: 'qualification',
          label: 'Qualification Code',
          keyDataType: 'CodeableConcept',
          referenceDeepPath: null,
          valueDeepPath: ['0', 'code'].join('$#$'),
        }
      ]
    }
    ]


  };
  dialog = inject(MatDialog);
  processSelectedRow(ev: any) {
    console.log(ev);
    this.dialog.open(CardzDetailsDialog, {
      data:
        ev.resource,

      maxWidth: '650px',
      maxHeight: '93vh',
    });
    // Process the selected row data here

    // For example, you can navigate to a details page or display more information

  }
}


@Component({
  selector: 'app-cardz-details-dialog',
  imports: [MatCardModule,
    JsonPipe,
    TitleCasePipe, MatIconModule, MatDividerModule, TabledOptionComponent,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './cardz-details-check.component.scss'
})
export class CardzDetailsDialog {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

  }
  detailsBuilderObject = {
    resourceName: "Low Supply Detail",
    resourceIcon: 'inventory_2',
    specialHeader: {
      specialHeaderKey: 'code',
      specialHeaderIcon: 'inventory_2',
      specialHeaderDataType: 'CodeableConcept',
      ReferenceDeepPath: null, // ['name', '0'].join('$#$');
      valueDeepPath: null,

    },
    groups: [{
      groupName: 'Details',
      groupIcon: 'info',
      groupMembers: [

        //name
        {
          key: 'code',
          label: 'Name',
          keyDataType: 'string',
          referenceDeepPath: null,
          valueDeepPath: ['coding', '0', 'display'].join('$#$'),
        },
        //alias
        {
          key: 'category',
          label: 'Category',
          keyDataType: 'CodeableConcept',
          referenceDeepPath: null,
          valueDeepPath: null,
        },
        {
          key: 'netContent',
          label: 'In Stock',
          keyDataType: 'number',
          referenceDeepPath: null,
          valueDeepPath: ['value'].join('$#$'),
        },
        {
          key: 'baseUnit',
          label: 'Base Unit',
          keyDataType: 'CodeableConcept',
          referenceDeepPath: null,
          valueDeepPath: null,
        },

        {
          key: 'inStockStatus',
          label: 'Quantity in Stock',
          keyDataType: 'IndividualField',
          referenceDeepPath: null,
          valueDeepPath: null,
        },

      ]
    }]
  };

  encounterService = inject(EncounterServiceService);
  takeStock(type: string) {
    if (type.trim().toLowerCase() === 'medication') {
      this.encounterService.addMedStock();
    } else {
      this.encounterService.addInventory();

    }
  }
}