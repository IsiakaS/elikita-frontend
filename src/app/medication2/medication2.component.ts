import { Component, inject } from '@angular/core';
import { tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, forkJoin, map, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { commonImports } from '../shared/table-interface';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { Bundle, ChargeItemDefinition, Medication, MedicationRequest, Resource } from 'fhir/r4';
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
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AddMedicationComponent } from './add-medication/add-medication.component';
import { PriceFormatPipe } from "../shared/price-format.pipe";
import { StateService } from '../shared/state.service';
// import { Det } from '../detailz-viewz/detailz-viewz.service';
import { ChipsDirective } from '../chips.directive';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { NaPipe } from '../shared/na.pipe';
import { EmptyStateComponent } from "../shared/empty-state/empty-state.component";
import { TableHeaderComponent } from '../table-header/table-header.component';


type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-medication2',
  imports: [
    ...commonImports,
    CommonModule,
    JsonPipe,
    ChipsDirective,
    DetailzViewzComponent,
    NaPipe,
    CodeableConcept2Pipe,
    CodeableRef2Pipe,
    References2Pipe,
    fetchFromReferencePipe,
    MatProgressSpinnerModule,
    DetailBaseComponent,
    PriceFormatPipe,
    EmptyStateComponent,
    TableHeaderComponent
  ],
  templateUrl: './medication2.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './medication2.component.scss']
})
export class MedicationComponent2 {
  medicationTableFilterArray = new Map<string, string[]>([
    ['status', ['active', 'inactive', 'entered-in-error', 'retired']],
    ['form', ['tablet', 'capsule', 'syrup', 'injection', 'ointment']]
  ]);
  medicationFiltersFormControlObject: Record<string, FormGroup> = {};
  private fb = inject(FormBuilder);
  dialog = inject(MatDialog);
  auth = inject(AuthService);
  capacityObject = capacityObject;
  stateService = inject(StateService);
  utilityService = inject(UtilityService);
  encounterService = inject(EncounterServiceService);
  errorService = inject(ErrorService);
  private readonly userId = this.auth.user?.getValue()?.['userId'];

  tableDataLevel2 = new BehaviorSubject<Medication[]>([]);
  tableDataSource = new MatTableDataSource<Medication>();
  medicationDisplayedColumns = ['status', 'code', 'form', 'manufacturer', 'amount', 'in-stock', 'action'];
  patientId: string | null = null;
  useOrgWideMedications = false;

  canAddMedication$ = this.auth.user.pipe(map(user => this.auth.can('medication', 'add')));
  canExportMedication$ = this.auth.user.pipe(map(user => this.auth.can('medication', 'viewAll')));

  detailsBuilder: DetailsBuilderObject = {
    resourceName: 'Medication',
    resourceIcon: 'medical_services',
    specialHeader: {
      strongSectionKey: 'code',
      iconSectionKeys: ['status'],
      contentSectionKeys: ['manufacturer', 'form']
    },
    groups: [
      { groupName: 'Identification', groupIcon: 'pill', groupKeys: ['code', 'manufacturer', 'status'] },
      { groupName: 'Packaging', groupIcon: 'inventory_2', groupKeys: ['form', 'amount'] },
      //inventory group
      { groupName: 'Inventory', groupIcon: 'inventory_2', groupKeys: ['inStock'] },
      {
        groupName: 'Ingredients', groupIcon: 'science', groupKeys: ['ingredient',
          'ingredient[0].itemCodeableConcept', 'ingredient[0].isActive', 'ingredient[0].strength',
          'ingredient[1].itemCodeableConcept', 'ingredient[1].isActive', 'ingredient[1].strength',
          'ingredient[2].itemCodeableConcept', 'ingredient[2].isActive', 'ingredient[2].strength',
          'ingredient[3].itemCodeableConcept', 'ingredient[3].isActive', 'ingredient[3].strength'
        ]
      }
    ]
  };

  ngOnInit() {
    this.medicationTableFilterArray.forEach((values, key) => {
      const group = this.fb.group({});
      values.forEach(value => group.addControl(value, new FormControl(false)));
      this.medicationFiltersFormControlObject[key] = group;
    });
    this.patientId = this.utilityService.getPatientIdFromRoute();
    const resolvedPatientId = this.stateService.currentPatientIdFromResolver.getValue();
    const encounterPatientId = this.stateService.currentEncounter.getValue()?.patientId ?? null;

    if (!resolvedPatientId && !encounterPatientId) {
      if (!this.auth.can('medication', 'viewAll')) {
        this.errorService.openandCloseError('No patient selected. Please pick a patient to view medications.');
        return;
      }
      this.useOrgWideMedications = true;
    } else {
      this.patientId = resolvedPatientId ?? encounterPatientId;
    }

    this.tableDataSource.connect = () => this.tableDataLevel2;
    this.observeMedications();
  }

  private observeMedications() {
    const stream = this.useOrgWideMedications
      ? this.stateService.orgWideResources.medications
      : this.stateService.PatientResources.medications;

    stream.subscribe((all: any[]) => {
      const meds = (all || [])
        .map(entry => entry.actualResource as Medication)
        .filter(Boolean)
        .reverse()
        .filter(med => {
          if (this.useOrgWideMedications || !this.patientId) return true;
          return true;
          // return med.subject?.reference?.endsWith(this.patientId);
        });
      this.tableDataLevel2.next(meds.map(med => ({ ...med, inStock: this.getRemainingInventory(med) })));
    });
  }

  showRow(row: Medication) {
    const dialogRef = this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '90vh',
      data: {
        resourceData: row,
        detailsBuilderObject: this.detailsBuilder
      }
    });
    dialogRef.componentInstance?.actionInvoked.subscribe(() => { }).unsubscribe();
  }

  addMedication() {
    this.dialog.open(AddMedicationComponent, {
      maxHeight: '93vh',
      maxWidth: '650px',
      autoFocus: false
    });
  }

  getRemainingInventory(med: Medication): string {
    const inventory = this.findInventoryExtension(med);
    // alert(JSON.stringify(inventory));
    if (!inventory) return 'N/A';
    const remaining = inventory//.find((ext: any) => this.extensionFieldKey(ext) === 'totalRemaining');
    // alert(JSON.stringify(remaining));
    const unitEntry = med.extension?.find((ext: any) => this.extensionFieldKey(ext) === 'dispensableUnits');
    const value = remaining?.valueQuantity?.value ?? remaining?.valueInteger ?? remaining?.valueString;
    const unit = unitEntry?.valueString || unitEntry?.valueCodeableConcept?.text || unitEntry?.valueCodeableConcept?.coding?.[0]?.display;
    if (value == null || value === '') return 'N/A';
    return `${value}${unit ? ` ${unit}` : ''}`;
  }

  private findInventoryExtension(med: Medication): any | undefined {
    return med.extension?.find((ext: any) =>
      typeof ext.url === 'string'
      && ext.url.includes('totalRemaining')
      //&& ext.url.includes('medication-inventory-details')
    );
  }

  private extensionFieldKey(ext: { url?: string }): string {
    const url = ext?.url || '';
    return url.split('/').pop() || url;
  }
}