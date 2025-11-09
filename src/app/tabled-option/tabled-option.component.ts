import { Component, ElementRef, EventEmitter, Inject, inject, Input, Optional, Output, ViewChild } from '@angular/core';
import { Bundle, BundleEntry, FhirResource, Resource } from 'fhir/r5';
import { commonImports } from '../shared/table-interface';
import { fieldType, FormFields, generalFieldsData } from '../shared/dynamic-forms.interface2';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { baseStatusStyles } from '../shared/statusUIIcons';
import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PriceFormatPipe } from '../shared/price-format.pipe';

@Component({
  selector: 'app-tabled-option',
  imports: [...commonImports,
    PriceFormatPipe,
    fetchFromReferencePipe, LowerCasePipe, TitleCasePipe],
  templateUrl: './tabled-option.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './tabled-option.component.scss']
})
export class TabledOptionComponent {
  statusStyles = baseStatusStyles;
  @Input() columns?: any[]
  @Input() isToBeSelected?: boolean = false;
  @Input() columnMetaData?: Map<string, {
    dataType?: fieldType,
    displayStyle?: 'normal' | 'chips' | any,
    inputType?: any,
    columnName?: string
  }>
  @Input() tableHeaderMetaData?: Map<string, string[]>
  tableHeaderFilterControls: { [key: string]: FormGroup<any>; } | any = {};
  columnLinks?: any
  @Input() rawTableData?: Bundle<any>
  tableData?: FhirResource[]
  @Output() selectedRow = new EventEmitter();
  isLinkObj: { [key: string]: Map<any, any> } = {}
  islink = inject(LinkInReferencesService);
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any,

    @Optional() public dref: MatDialogRef<TabledOptionComponent>) {
    if (data && data.rawTableData) {
      this.rawTableData = data.rawTableData;
    }
    if (data && data.columns) {
      this.columns = data.columns;
    }
    if (data && data.columnMetaData) {
      this.columnMetaData = data.columnMetaData;
    }
    if (data && data.tableHeaderMetaData) {
      this.tableHeaderMetaData = data.tableHeaderMetaData;
    }
    if (data && data.isToBeSelected) {
      this.isToBeSelected = data.isToBeSelected;
    }
    if (data && data.columnLinks) {
      this.columnLinks = data.columnLinks;
    }



  }

  // alltds(td: HTMLTableCellElement): void {
  //   //  alert(td!.parentElement!.innerHTML);
  //   const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
  //   tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
  //   (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
  //   (td as HTMLElement).parentElement!.style!.overflow = "visible"
  // }

  registerReferencesforEachResources(e: BundleEntry, index: number): void {
    for (const [key, value] of Object.entries(e.resource as FhirResource)) {
      console.log(value.reference);
      if (this.isLinkObj.hasOwnProperty(key)) {
        this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
      } else {
        this.isLinkObj[key] = new Map();
        this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
      }
      console.log(this.isLinkObj[key]);

    }

  }


  ngOnInit() {
    // this.selectedRow = new EventEmitter();
    if (this.columns && this.isToBeSelected) {
      this.columns.push('action');
    }


    for (const [key, value] of this.tableHeaderMetaData || []) {
      this.tableHeaderFilterControls[key] = new FormGroup({});
      for (const filterValue of value) {
        this.tableHeaderFilterControls[key].addControl(filterValue, new FormControl(false));
      }
    }


    if (this.rawTableData) {
      this.rawTableData.entry?.forEach((f: BundleEntry<any>, index: number) => {
        if (!this.tableData) {
          this.tableData = [];
        }
        this.tableData.push(f.resource);
        this.registerReferencesforEachResources(f, index);
      })
    }

  }

  passSelectedRowAsReference(row: FhirResource) {
    // alert("clicke")

    let toReturn: any = {
      reference: "",
      display: ""
    }
    console.log(row, 'row');
    if (row.resourceType == 'Specimen') {
      toReturn.display = row.type?.text || row.type?.coding?.[0]?.display || row.type?.coding?.[0]?.code || "";
      toReturn.reference = `${row.resourceType}/${row.identifier?.[0]?.value || row.id || new Date().getTime()}`
    }
    else if (row.resourceType == 'Patient' || row.resourceType == 'Practitioner') {
      toReturn.display = row.name?.[0]?.family + " " + row.name?.[0]?.given?.join(" ");
      toReturn.reference = `${row.resourceType}/${row.identifier?.[0]?.value || row.id || new Date().getTime()}`
    }
    else if (row.resourceType == 'Observation') {
      toReturn.display = row.code?.text || row.code?.coding?.[0]?.display || row.code?.coding?.[0]?.code || "";
      toReturn.reference = `${row.resourceType}/${row.identifier?.[0]?.value || row.id || new Date().getTime()}`
    } else {
      toReturn = row;
    }
    console.log(toReturn, 'toReturn');
    console.log(row, 'row');
    if (!this.data) {
      this.selectedRow.emit({
        reference: toReturn,
        resource: row
      })
    } else {
      this.dref.close({
        reference: toReturn,
        resource: row
      })
    }
  }

  alltds(td: HTMLTableCellElement, actualBaseWrapper: HTMLElement): void {
    // alert("clicked");
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
    // alert("F")
    // console.log('alltds called', $event?.currentTarget.className, $event?.target.className);
    // if ($event?.target.className.includes('link-group-icon')
    //   || $event?.target.className.includes('mat-icon')
    //   || $event?.target.className.includes('mat-expansion-panel-header')) {
    if (true) {

      // if (this.tdReference) {
      //   this.tdClicked.emit(this.tdReference)
      // } else {
      //   this.tdClicked.emit(null);
      // }
      let actualBase = actualBaseWrapper.querySelector('.actualBase') as HTMLElement;
      console.log(actualBase, 'actualBase');

      const si = setInterval(() => {
        actualBase = actualBaseWrapper.querySelector('.actualBase') as HTMLElement;
        console.log(actualBase, 'actualBase');
        if (actualBase && actualBase) {

          // debugger;
          const actualBaseRect = actualBase.getBoundingClientRect();


          // const dialogSurface = document.querySelector('.mat-mdc-dialog-surface.mdc-dialog__surface');
          if (true) {
            if (td.parentElement?.tagName === 'TR') {
              const tr = td.parentElement;
              const dialogRect = tr.getBoundingClientRect();
              if (actualBaseRect.left >= dialogRect.left) {
                // (actualBase as HTMLElement).style.width = '250px';
                // (actualBase as HTMLElement).style.overflowX = 'auto';
              } else {
                actualBase.style.width = `${250 - (dialogRect.left - actualBaseRect.left)}px`;
                // alert(`${dialogRect.right}`);
                // alert(`${actualBaseRect.left}`);
                actualBase.style.overflowX = 'auto';

              }
            }
          } else {
            console.warn('Dialog surface not found, cannot adjust width.');
          }
          clearInterval(si);
        }
      }, 3000);

    }

  }

  // @ViewChild('actualBase') actualBase?: ElementRef;

  processDeepPath(element: any, deepPath: string[]): any {
    let current = element;
    for (const key of deepPath) {
      current = current?.[key];
      if (!current) {
        return "N/A";
      }
    }
    return current;
  }
}
