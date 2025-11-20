import { Component, inject } from '@angular/core';
import { Bundle } from 'fhir/r5';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StateService } from '../shared/state.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AddSpecimenComponent } from '../specimen/add-specimen/add-specimen.component';

@Component({
  selector: 'app-specimens',
  imports: [TabledOptionComponent, 
    MatButtonModule,
    JsonPipe, AsyncPipe, MatCardModule, MatDividerModule, MatIconModule],
  templateUrl: './specimens.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss','./specimens.component.scss']
})
export class SpecimensComponent {
  http = inject(HttpClient);
  private auth = inject(AuthService);
  private encounterService = inject(EncounterServiceService);
  canAddSpecimen$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('specimen', 'add')));
  canExportSpecimen$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('specimen', 'viewAll')));
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['request', {
      dataType: "IndividualReferenceField",
      columnName: "Lab Request"
    }],
    ['status', {
      dataType: "IndividualField",
      displayStyle: "chips",
      columnName: "Status"
    }],
    ['receivedTime', {
      dataType: "IndividualField",
      columnName: "Received Time"
    }],
    ['type', {
      dataType: "CodeableConceptField",

      columnName: "Type"
    }],

    ['subject', {
      dataType: "IndividualReferenceField",

      columnName: "Patient"
    }],



    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['receivedTime', 'status', 'type', 'subject',],
  }
  ngOnInit() {
    this.http.get("https://hapi.fhir.org/baseR5/Specimen?_format=json").subscribe((e: any) => {
      console.log(e)
      this.testingTabeledOption.rawTableData = e;

    })
  }
stateService = inject(StateService);
dialog = inject(MatDialog);
  onAddSpecimen(): void {
this.dialog.open(AddSpecimenComponent, {
  maxHeight: '93vh',
  maxWidth: '650px',


})


    //  this.encounterService.addSpecimen();
    
  }

  onExportSpecimens(): void {
    console.warn('Export specimens not implemented yet.');
  }
}
