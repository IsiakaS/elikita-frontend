import { Component, inject } from '@angular/core';
import { Bundle } from 'fhir/r5';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { HttpClient } from '@angular/common/http';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { JsonPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-lab-supply',
  imports: [TabledOptionComponent, JsonPipe, MatCardModule, MatDividerModule],
  templateUrl: './lab-supply.component.html',
  styleUrl: './lab-supply.component.scss'
})
export class LabSupplyComponent {
  http = inject(HttpClient);
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
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['category', 'code', 'netContent.value', 'baseUnit',],
  }
  ngOnInit() {
    this.http.get("/iitem.json").subscribe((e: any) => {
      console.log(e)
      this.testingTabeledOption.rawTableData = e;

    })
  }

}
