import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AppointmentUiComponent } from '../appointment-ui/appointment-ui.component';
import { commonImports } from '../shared/table-interface';
import { MatDialog } from '@angular/material/dialog';
import { AddMedicationComponent } from '../medication2/add-medication/add-medication.component';
import { ScrolldDirective } from '../scrolld.directive';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { Bundle } from 'fhir/r5';
import { HttpClient } from '@angular/common/http';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { DummyMedicationRequestDetailsComponent } from '../dummy-medication-request-details/dummy-medication-request-details.component';
import { CardzDetailsCheckComponent } from '../cardz-details-check/cardz-details-check.component';

@Component({
  selector: 'app-pharmacy-dashboard',
  host: {
    class: 'pharmacy-dashboard',
  },
  imports: [AppointmentUiComponent,
    CardzDetailsCheckComponent,
    ...commonImports, ScrolldDirective, TabledOptionComponent],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['../admin-dashboard/admin-dashboard.component.scss', './pharmacy-dashboard.component.scss']
})
export class PharmacyDashboardComponent {

  dialog = inject(MatDialog);

  addMedicine() {
    this.dialog.open(AddMedicationComponent, {
      maxWidth: '650px',
      maxHeight: '93vh',

    })
  }


  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['medicationCodeableConcept', {
      dataType: "CodeableConceptField",
      columnName: "Name"
    }],
    ['subject', {
      dataType: "IndividualReferenceField",
      displayStyle: "chips",
      columnName: "Patient"
    }],
    ['status', {
      dataType: "SingleCodeField",
      displayStyle: "chips",
      columnName: "Status"
    }],


    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['medicationCodeableConcept', 'subject',],
  }
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  ngOnInit() {
    this.http.get("/medication2_bundle.json").subscribe((e: any) => {
      this.testingTabeledOption.rawTableData = { ...e, entry: [...e.entry.slice(0, 5)] };
      this.cd.detectChanges();

    })
  }
  http = inject(HttpClient);
  lowStockLoaded = false;

  processSelectedRow(ev: any) {
    this.dialog.open(DummyMedicationRequestDetailsComponent, {
      maxWidth: '650px',
      maxHeight: '93vh',

    })
  }
  processLoaded() {
    setTimeout(() => {
      this.lowStockLoaded = true
    }, 100)
  }
}
