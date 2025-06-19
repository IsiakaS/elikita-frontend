import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatInputModule } from '@angular/material/input'
import { MatFormField } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider'
import { MatChipsModule } from '@angular/material/chips'
import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { HttpClient } from '@angular/common/http';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { MedicationRequest } from 'fhir/r5';
import { Dialog } from '@angular/cdk/dialog';
import { DummyMedicationRequestDetailsComponent } from '../dummy-medication-request-details/dummy-medication-request-details.component';
import { MatDialog } from '@angular/material/dialog';
import { ErrorService } from './error.service';
import { UtilityService } from './utility.service';


export const commonImports = [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule];



export interface tablePropInt {
    utilityService: UtilityService,
    route: ActivatedRoute,
    immutableLevelTableData: any[],
    tableDataSource: MatTableDataSource<any>,
    tableDataLevel2: BehaviorSubject<any>,
    references: Map<string, any>,
    tableFilter: Map<string, any[]>,
    tableFilterFormControlObject: {
        [key: string]: FormGroup;
    },
    patientName: Observable<string | null>,
    patientId: string | null,
    tableColumns: string[];
    http: HttpClient,
    patientOpenAndClose: PatientDetailsKeyService,
    getPatientName(): void,
    getPatientId(): void,
    connectTableDataSource(): void,
    subscribeToResolver(): void,
    dialog: MatDialog,
    errorService: ErrorService,
    showRow(row: any): void,

}
