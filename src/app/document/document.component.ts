import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';
import { commonImports } from '../shared/table-interface';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AddMedicationComponent } from '../medication2/add-medication/add-medication.component';
import { ScrolldDirective } from '../scrolld.directive';
import { fieldType, formMetaData, generalFieldsData, IndividualReferenceField } from '../shared/dynamic-forms.interface2';
import { Bundle } from 'fhir/r5';
import { HttpClient } from '@angular/common/http';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { DummyMedicationRequestDetailsComponent } from '../dummy-medication-request-details/dummy-medication-request-details.component';
import { CardzDetailsCheckComponent } from '../cardz-details-check/cardz-details-check.component';
import { EncounterV2Component } from '../encounter-v2/encounter-v2.component';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { forkJoin } from 'rxjs';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';

@Component({
  selector: 'app-document',
  imports: [AppointmentUiComponent,
    CardzDetailsCheckComponent,
    ...commonImports, ScrolldDirective, TabledOptionComponent],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss'
})
export class DocumentComponent {
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', "draft | issued | balanced | cancelled | entered-in-error".split(' | ')],
    ]),
    columnMetaData: new Map([['medicationCodeableConcept', {
      dataType: "CodeableConceptField",
      columnName: "Name"
    }],
    ['date', {
      dataType: "DateTimeField",
      inputType: "datetime-local",
      displayStyle: "normal",
      columnName: "Creation Date"
    }],
    ['subject', {
      dataType: "IndividualReferenceField",
      displayStyle: "normal",
      columnName: "Patient"
    }],
    ['author.0', {
      dataType: "IndividualReferenceField",
      displayStyle: "normal",
      columnName: "Author"
    }],
    ['totalNet.value$#$totalNet.currency', {
      dataType: "MoneyField",
      displayStyle: "normal",
      inputType: "money",
      columnName: "Total Amount"
    }],
    ['docStatus', {
      dataType: "SingleCodeField",
      displayStyle: "chips",
      columnName: "Document Status"
    }
    ],
    ['type', {
      dataType: "CodeableConceptField",
      displayStyle: "normal",
      columnName: "Type"
    }
    ],
    ['content.0.attachment.title', {
      dataType: "StringField",
      displayStyle: "normal",
      columnName: "Title"
    }],
    ['content.0.attachment.url', {
      dataType: "StringField",
      displayStyle: "normal",
      inputType: "link",
      columnName: "URL"
    }],



    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['date', 'docStatus', 'type', 'subject', 'author.0',
      'content.0.attachment.title', 'content.0.attachment.url'

    ],
  }
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  ngOnInit() {
    this.http.get("https://server.fire.ly/r5/DocumentReference?_format=json").subscribe((e: any) => {
      this.testingTabeledOption.rawTableData = { ...e, entry: [...e.entry.slice(0, 40)] };
      this.cd.detectChanges();

    })
    forkJoin({
      'encounter': this.formFieldService.getFormFieldSelectData('addClaim', 'encounter'),
    }).subscribe((g: any) => {
      this.toUseEncounterForm = <IndividualReferenceField>{
        generalProperties: <generalFieldsData>{
          auth: {
            read: 'all',
            write: 'doctor, nurse'
          },
          fieldApiName: 'encounterRef',
          fieldName: "Encounter",
          fieldType: 'IndividualReferenceField',
          inputType: 'text',
          isArray: false,
          isGroup: false,

        },
        data: g.encounter,
      };
    });
  }
  toUseEncounterForm?: any;
  http = inject(HttpClient);
  formFieldService = inject(FormFieldsSelectDataService)
  processSelectedRow(ev: any) {

  }
  dialog = inject(MatDialog)




}
