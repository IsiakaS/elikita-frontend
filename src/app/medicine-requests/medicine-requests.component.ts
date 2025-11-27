import { Component, ElementRef, inject, ViewChild, Input } from '@angular/core';
import { tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { commonImports } from '../shared/table-interface';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { Bundle, MedicationRequest, Reference, Resource } from 'fhir/r4';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { References2Pipe } from '../shared/references2.pipe';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { baseStatusStyles } from '../shared/statusUIIcons';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { DummyMedicationRequestDetailsComponent } from '../dummy-medication-request-details/dummy-medication-request-details.component';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { MedicineAdministrationDialogService } from './medicine-administration-dialog.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { StateService } from '../shared/state.service';
import { EmptyStateComponent } from "../shared/empty-state/empty-state.component";
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { DetailzViewzComponent, DetailActionButton } from '../detailz-viewz/detailz-viewz.component';

import { ResourceSortService } from '../shared/resource-sort.service';
import { MedicineRequestsDialogService } from './medicine-requests-dialog.service';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-medicine-requests',
  imports: [...commonImports,
    CommonModule, ReferenceDisplayDirective,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent, EmptyStateComponent],
  templateUrl: './medicine-requests.component.html',
  styleUrl: './medicine-requests.component.scss'
})
export class MedicineRequestsComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: MedicationRequest[];
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([]);
  references!: Map<string, any>;
  tableFilter!: Map<string, any[]>;
  tableFilterFormControlObject: { [key: string]: FormGroup<any>; } | any = {};
  patientName!: Observable<string | null>;
  patientId!: string | null;
  useOrgWideMedicationRequests = false;
  medicationRequestSource?: BehaviorSubject<any>;
  tableColumns!: string[];
  private readonly baseTableColumns = [
    'groupIdentifier',
    'status',
    'subject',
    'medication',
    'action'
  ];
  @Input() set medicineRequestTableColumns(columns: string[] | undefined) {
    this.tableColumns = columns?.length ? [...columns] : [...this.baseTableColumns];
  }


  http: HttpClient = inject(HttpClient);
  // utilityService = inject(UtilityService)
  patientOpenAndClose: PatientDetailsKeyService = inject(PatientDetailsKeyService);
  resourceSortService = inject(ResourceSortService);
  getPatientName(): void {
    if (!this.getPatientId()) return;
    this.patientName = this.utilityService.getPatientName(this.getPatientId)
  }
  stateService = inject(StateService);
  getPatientId(): string | null {
    return this.patientId = this.route.parent?.snapshot.params['id'] || this.utilityService.getPatientIdFromRoute();
  }
  connectTableDataSource(): void {
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2
    }
  }
  isLinkObj: { [key: string]: Map<any, any> } = {}
  subscribeToResolver(): void {
    const source = this.medicationRequestSource ?? this.stateService.PatientResources.medicationRequests;
    source.subscribe((allData: any) => {
      const mappedResources = allData.map((e: any, index: number) => {
        e.resource = e.actualResource as MedicationRequest;
        for (const [key, value] of Object.entries(e.resource as MedicationRequest)) {
          console.log(value.reference);
          if (this.isLinkObj.hasOwnProperty(key)) {
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          } else {
            this.isLinkObj[key] = new Map();
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          }
          console.log(this.isLinkObj[key]);

        }
        return e.resource as MedicationRequest
      });
      this.immutableLevelTableData = this.resourceSortService.sortResources(mappedResources, ['authoredOn', 'authoredDateTime', 'authored'], 'desc');
      const sortedAccRequisition: { [key: string]: MedicationRequest[] } = {}
      this.immutableLevelTableData?.forEach((e: MedicationRequest) => {

        if (e.hasOwnProperty('groupIdentifier') && e.groupIdentifier?.hasOwnProperty('value')) {
          if (!sortedAccRequisition.hasOwnProperty(e.groupIdentifier!.value!)) {
            sortedAccRequisition[e.groupIdentifier!.value!] = [];
          }
          sortedAccRequisition[e.groupIdentifier!.value!].push(e);
        } else {
          sortedAccRequisition['N/A'] = sortedAccRequisition['N/A'] || [];
          sortedAccRequisition['N/A'].push(e);
        }
        this.sortedWithRequisition = sortedAccRequisition;
      })
      console.log(sortedAccRequisition);
      this.sortedWithRequisitionKeys = Object.keys(sortedAccRequisition);
      console.log(this.sortedWithRequisitionKeys);
      this.immutableLevelTableData = [];
      Object.values(sortedAccRequisition).forEach((e: MedicationRequest[]) => {
        this.immutableLevelTableData = [...this.immutableLevelTableData || [], ...e];
      });
      // this.references = new Map(allData['patMed']['references']);
      // console.log(this.references);
      console.log(this.immutableLevelTableData);
      this.rawMedicationRequests = this.immutableLevelTableData;
      this.pushFilteredMedicationRequests();
    })
  }
  sortedWithRequisition: { [key: string]: MedicationRequest[] } = {};
  sortedWithRequisitionKeys: string[] = [];
  //for determining actions available to the user
  auth = inject(AuthService);
  user: any = null;
  encounterService = inject(EncounterServiceService);
  capacityObject = capacityObject;
  ngOnInit() {

    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['medicationRequest']['request'].push('testing');

      }

    })
    this.tableFilter = new Map([[
      'status', ['active', 'on-hold', 'ended', 'stopped', 'completed', 'cancelled', 'draft']
    ]
    ])

    this.tableColumns = [
      'groupIdentifier',
      'status',
      'subject',
      'medication',
      'action',
      // 'groupReport',

    ]
    this.getPatientId();
    this.getPatientName();
    this.connectTableDataSource();
    const resolvedPatientId = this.stateService.currentPatientIdFromResolver.getValue();
    const encounterPatientId = this.stateService.currentEncounter.getValue()?.patientId ?? null;
    const canViewAllMedicationRequests = this.auth.can('medicationRequest', 'viewAll');

    if (!resolvedPatientId && !encounterPatientId && !canViewAllMedicationRequests) {
      this.errorService.openandCloseError("No patient selected. Please select a patient to view medication requests.");
      return;
    }

    this.useOrgWideMedicationRequests = !resolvedPatientId && !encounterPatientId && canViewAllMedicationRequests;
    if (this.useOrgWideMedicationRequests) {
      this.patientId = null;
    } else {
      this.patientId = resolvedPatientId ?? encounterPatientId;
    }

    this.medicationRequestSource = this.useOrgWideMedicationRequests
      ? this.stateService.orgWideResources.medicationRequests
      : this.stateService.PatientResources.medicationRequests;
    this.subscribeToResolver();

    for (const [key, value] of this.tableFilter) {
      this.tableFilterFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.tableFilterFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }
  }
  dialog: MatDialog = inject(MatDialog);
  errorService: ErrorService = inject(ErrorService);
  private snackBar = inject(MatSnackBar);
  showRow(row: MedicationRequest): void {
    const dialogRef = this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '90vh',
      data: {
        resourceData: row,
        detailsBuilderObject: this.detailsBuilder,
        actionButtons: this.buildMedicationRequestActions()
      }
    });

    const sub = dialogRef.componentInstance?.actionInvoked.subscribe(({ key }) => {
      this.handleDetailAction(key, row);
    });

    dialogRef.afterClosed().subscribe(() => sub?.unsubscribe());
  }

  private buildMedicationRequestActions(): DetailActionButton[] {
    return [
      {
        key: 'changeStatus',
        label: 'Change Status',
        icon: 'sync',
        color: 'warn',
        capabilities: [{ resource: 'medicationRequest', action: 'update' }]
      },
      {
        key: 'recordDispense',
        label: 'Dispense',
        icon: 'local_pharmacy',
        color: 'accent',
        capabilities: [{ resource: 'medicationRequest', action: 'dispense' }]
      },
      {
        key: 'recordAdministration',
        label: 'Administer',
        icon: 'vaccines',
        color: 'primary',
        capabilities: [{ resource: 'medicationRequest', action: 'administer' }]
      }
    ];
  }

  private handleDetailAction(actionKey: string, row: MedicationRequest): void {
    switch (actionKey) {
      case 'changeStatus':
        this.promptStatusChange(row);
        break;
      case 'recordDispense':
        const medicationRef = row.medicationReference as Reference;
        const medicationReferenceValue = medicationRef?.reference
          ? { reference: medicationRef.reference, display: medicationRef?.display }
          : null;
        //alert(JSON.stringify(medicationReferenceValue));
        const medicationCodeableConcept = row.medicationCodeableConcept ?? null;
        const subjectReference = (row.subject as Reference) ?? null;
        this.medicineRequestsDialogService.openDispenseDialog(
          row.id ?? null,
          medicationReferenceValue,
          medicationCodeableConcept,
          subjectReference,
          row
        );
        break;
      case 'recordAdministration':
        this.administer(row);
        break;
      default:
        break;
    }
  }

  private promptStatusChange(row: MedicationRequest): void {
    const label = row.id ?? 'medication request';
    this.snackBar.open(`Change status clicked for ${label}`, 'Dismiss', { duration: 2500 });
  }

  detailsBuilder: DetailsBuilderObject = {
    resourceName: 'Medication Request',
    resourceIcon: 'prescriptions',
    specialHeader: {
      strongSectionKey: ['medicationCodeableConcept', 'medicationReference'],
      iconSectionKeys: ['status', 'intent'],
      contentSectionKeys: ['subject', 'authoredOn']
    },
    groups: [
      {
        groupName: 'Classification',
        groupIcon: 'category',
        groupKeys: ['priority', 'status', 'intent', 'category']
      },
      {
        groupName: 'Participants',
        groupIcon: 'group',
        groupKeys: ['subject', 'requester', 'performer', 'performerType']
      },
      {
        groupName: 'Clinical Details',
        groupIcon: 'science',
        groupKeys: ['medicationCodeableConcept', 'medicationReference', 'dosageInstruction', 'reasonCode']
      },
      {
        groupName: 'Fulfilment',
        groupIcon: 'check_circle',
        groupKeys: ['authoredOn', 'dispenseRequest', 'substitution',]
      }
    ]
  }
  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }




  viewDetails(element: any) {
    this.dialog.open(DummyMedicationRequestDetailsComponent,

      {
        maxHeight: '93vh',


      })
  }

  medicineRequestsDialogService = inject(MedicineRequestsDialogService);
  medicineAdministrationDialogService = inject(MedicineAdministrationDialogService);
  administer(medication: MedicationRequest) {
    this.medicineAdministrationDialogService.openAdministrationDialog(medication);
  }

  @Input() set medicineRequestTableFilters(filters: Array<{ field: string; values?: any[] }> | undefined) {
    this.appliedMedicationRequestFilters = (filters || []).filter(Boolean);
    this.pushFilteredMedicationRequests();
  }
  private appliedMedicationRequestFilters: Array<{ field: string; values?: any[] }> = [];
  private rawMedicationRequests: MedicationRequest[] = [];

  private pushFilteredMedicationRequests() {
    const filtered = this.applyMedicationRequestFilters(this.rawMedicationRequests);
    this.tableDataLevel2.next(filtered);
  }

  private applyMedicationRequestFilters(items: MedicationRequest[]): MedicationRequest[] {
    if (!this.appliedMedicationRequestFilters.length) return items;
    return items.filter((item) =>
      this.appliedMedicationRequestFilters.every((filter) => {
        const value = this.getNestedFieldValue(item, filter.field);
        if (!filter.values?.length) return true;
        return filter.values.includes(value);
      })
    );
  }

  private getNestedFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, segment) => (curr ? curr[segment] : undefined), obj);
  }

  // private readonly baseTableColumns = [
  //   'groupIdentifier',
  //   'status',
  //   'subject',
  //   'medication',
  //   'action'
  // ];
  // @Input() set medicineRequestTableColumns(columns: string[] | undefined) {
  //   this.tableColumns = columns?.length ? [...columns] : [...this.baseTableColumns];
  // }
}