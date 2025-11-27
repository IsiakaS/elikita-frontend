import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, map } from 'rxjs';
import { MedicationDispense } from 'fhir/r4';
import { StateService } from '../shared/state.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { ErrorService } from '../shared/error.service';
import { UtilityService } from '../shared/utility.service';
import { AddMedicationDispenseComponent } from './add-medication-dispense/add-medication-dispense.component';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ChipsDirective } from '../chips.directive';
import { NaPipe } from '../shared/na.pipe';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { TableHeaderComponent } from '../table-header/table-header.component';

@Component({
    selector: 'app-medication-dispense',
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTableModule,
        MatTooltipModule,
        CommonModule,
        AsyncPipe,
        NaPipe,
        ReferenceDisplayDirective,
        DetailzViewzComponent,
        EmptyStateComponent,
        ChipsDirective,
        TableHeaderComponent
    ],
    templateUrl: './medication-dispense.component.html',
    styleUrls: ['../medicine-requests/medicine-requests.component.scss', './medication-dispense.component.scss']
})
export class MedicationDispenseComponent implements OnInit {
    medDispenseTableFilterArray = new Map<string, string[]>([
        ['status', ['completed', 'in-progress', 'cancelled', 'entered-in-error']],
        ['medication', ['Amoxicillin', 'Paracetamol', 'Metformin', 'Ibuprofen']]
    ]);
    medDispenseFiltersFormControlObject: Record<string, FormGroup> = {};
    private fb = inject(FormBuilder);
    dialog = inject(MatDialog);
    stateService = inject(StateService);
    auth = inject(AuthService);
    errorService = inject(ErrorService);
    utilityService = inject(UtilityService);
    capacityObject = capacityObject;

    tableDataLevel2 = new BehaviorSubject<MedicationDispense[]>([]);
    tableDataSource = new MatTableDataSource<MedicationDispense>();
    displayedColumns = ['whenHandedOver', 'status', 'medication', 'subject', 'quantity', 'action'];
    patientId: string | null = null;
    useOrgWide = false;

    canAddDispense$ = this.auth.user.pipe(map(user => this.auth.can('medicationDispense', 'add')));
    canViewAllDispenses$ = this.auth.user.pipe(map(user => this.auth.can('medicationDispense', 'viewAll')));

    detailsBuilder: DetailsBuilderObject = {
        resourceName: 'Medication Dispense',
        resourceIcon: 'local_pharmacy',
        specialHeader: {
            strongSectionKey: 'medicationCodeableConcept',
            iconSectionKeys: ['status'],
            contentSectionKeys: ['subject', 'whenHandedOver']
        },
        groups: [
            { groupName: 'Identification', groupIcon: 'playlist_add_check', groupKeys: ['status', 'category'] },
            { groupName: 'Medication', groupIcon: 'medication', groupKeys: ['medicationCodeableConcept', 'medicationReference'] },
            { groupName: 'Logistics', groupIcon: 'calendar_today', groupKeys: ['whenHandedOver', 'quantity'] }
        ]
    };

    ngOnInit(): void {
        this.medDispenseTableFilterArray.forEach((values, key) => {
            const group = this.fb.group({});
            values.forEach(value => group.addControl(value, new FormControl(false)));
            this.medDispenseFiltersFormControlObject[key] = group;
        });
        this.patientId = this.utilityService.getPatientIdFromRoute();
        const resolvedPatientId = this.stateService.currentPatientIdFromResolver.getValue();
        const encounterPatientId = this.stateService.currentEncounter.getValue()?.patientId ?? null;

        if (!resolvedPatientId && !encounterPatientId) {
            if (!this.auth.can('medicationDispense', 'viewAll')) {
                this.errorService.openandCloseError('No patient selected. Please pick a patient to view medication dispenses.');
                return;
            }
            this.useOrgWide = true;
        } else {
            this.patientId = resolvedPatientId ?? encounterPatientId;
        }

        this.tableDataSource.connect = () => this.tableDataLevel2;
        this.observeDispenses();
    }

    private observeDispenses() {
        const stream = this.useOrgWide
            ? this.stateService.orgWideResources.medicationDispenses
            : this.stateService.PatientResources.medicationDispenses;

        stream.subscribe((all: any[]) => {
            const dispenses = (all || [])
                .map(entry => entry.actualResource as MedicationDispense)
                .filter(Boolean)
                .reverse()
                .filter(dispense => {
                    if (this.useOrgWide || !this.patientId) return true;
                    return dispense.subject?.reference === `Patient/${this.patientId}`;
                });
            this.tableDataLevel2.next(dispenses);
        });
    }

    openDispenseDialog(): void {
        this.dialog.open(AddMedicationDispenseComponent, {
            maxWidth: '650px',
            maxHeight: '90vh',
            autoFocus: false
        });
    }

    showRow(row: MedicationDispense): void {
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

    formatMedication(row: MedicationDispense): string {
        return row.medicationCodeableConcept?.text
            || row.medicationCodeableConcept?.coding?.[0]?.display
            || row.medicationReference?.display
            || row.medicationReference?.reference
            || 'N/A';
    }

    formatQuantity(row: MedicationDispense): string {
        const quantity = row.quantity;
        if (!quantity) return 'N/A';
        const value = quantity.value ?? '';
        const unit = quantity.unit ?? '';
        return `${value}${unit ? ` ${unit}` : ''}`;
    }
}
