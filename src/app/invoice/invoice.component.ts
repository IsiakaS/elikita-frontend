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
  selector: 'app-invoice',
  imports: [AppointmentUiComponent,
    CardzDetailsCheckComponent,
    ...commonImports, ScrolldDirective, TabledOptionComponent],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent {



  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', "draft | issued | balanced | cancelled | entered-in-error".split(' | ')],
    ]),
    columnMetaData: new Map([['medicationCodeableConcept', {
      dataType: "CodeableConceptField",
      columnName: "Name"
    }],
    ['creation', {
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
    ['status', {
      dataType: "SingleCodeField",
      displayStyle: "chips",
      columnName: "Status"
    }],
    ['totalNet.value$#$totalNet.currency', {
      dataType: "MoneyField",
      displayStyle: "normal",
      inputType: "money",
      columnName: "Total Amount"
    }]


    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['creation', 'status', 'subject', 'totalNet.value$#$totalNet.currency'],
  }
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  ngOnInit() {
    this.http.get("https://server.fire.ly/r4/Invoice?_format=json").subscribe((e: any) => {
      this.testingTabeledOption.rawTableData = { ...e, entry: [...e.entry.slice(0, 12)] };
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
    this.dialog.open(DummyMedicationRequestDetailsComponent, {
      maxWidth: '650px',
      maxHeight: '93vh',

    })
  }
  dialog = inject(MatDialog)

  addClaim() {

    this.dialog.open(SDialog, {
      maxWidth: '650PX',
      maxHeight: '93vh',
      data: {
        toUseEncounterForm: this.toUseEncounterForm,

      }
    });
  }

}

@Component({
  imports: [DynamicFormsV2Component],
  template: `
<div></div>
`
})
export class SDialog {
  toPassMetaData: formMetaData = {
    formName: 'Choose Encounter',
    formDescription: "Select the encounter to use as a basis for this claim.",
    showSubmitButton: true,
    submitText: "Submit",
    closeDialogOnSubmit: true
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
  }
  dialog = inject(MatDialog);

  ngOnInit() {
    console.log(this.data)
    const rr = this.dialog.open(DynamicFormsV2Component, {
      maxWidth: '650PX',
      maxHeight: '93vh',
      data: {
        formMetaData: this.toPassMetaData,
        formFields: [this.data.toUseEncounterForm],
      },
    })

    rr.afterClosed().subscribe((result) => {
      this.dialog.open(EncounterV2Component, {
        maxWidth: '1200PX',
        maxHeight: '93vh',

      })

    })

  }

}