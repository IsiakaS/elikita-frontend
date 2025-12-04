import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { TitleCasePipe, DatePipe } from '@angular/common';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { RecordHolderService } from '../patients-record/record-holder.service';
import { BreadcrumbService } from '../shared/breadcrumb.service';
import { PatientNamePipe } from '../shared/pipes/patient-name.pipe';
import { PatientAddressPipe } from '../shared/pipes/patient-address.pipe';
import { PatientContactsPipe } from '../shared/pipes/patient-contacts.pipe';
import { PatientAgePipe } from '../shared/pipes/patient-age.pipe';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AuthService } from '../shared/auth/auth.service';


@Component({
  selector: 'app-patients',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe, DatePipe,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, PatientNamePipe, PatientAddressPipe, PatientContactsPipe, PatientAgePipe, EmptyStateComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {
  route = inject(ActivatedRoute);
  patientsRegistrationData: any;
  patientsTableFilter = new Map([[
    'gender', ['Male', 'Female', 'Others']
  ]])

  patientsTableFilterArray = this.patientsTableFilter;

  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  patientsFiltersFormControlObject: any = {};
  patientsTableDisplayedColumns = ['name', 'phone',
    'gender', 'age',
    'address'
  ]

  breadCrumbService = inject(BreadcrumbService);

  currentEmptyState = {
    icon: 'people_outline',
    title: 'No active patients found',
    subtitle: 'There are currently no active patients in the system or all patients have been filtered out.'
  };

  private auth = inject(AuthService);

  canAdd$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('patient', 'add')));
  canExport$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('patient', 'viewAll')));

  constructor() {

  }
  ngOnInit() {

    //this.breadCrumbService.buildBreadcrumb(this.route.pathFromRoot);
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }
    console.log(Object.entries(this.patientsTableFilter));
    this.route.data.subscribe((resolvedDataObject) => {
      this.patientsRegistrationData = resolvedDataObject['patientsRegistrationData'];

      console.log('Raw resolver data:', this.patientsRegistrationData);
      console.log('First patient sample:', this.patientsRegistrationData?.[0]);
      
      // Determine the appropriate empty state based on data
      this.updateEmptyStateForDataScenario(this.patientsRegistrationData);
      
      // Filter for active, non-deceased patients (additional layer of filtering)
      const activePatients = this.filterActivePatients(this.patientsRegistrationData);
      console.log(`Filtered ${this.patientsRegistrationData?.length || 0} down to ${activePatients.length} active patients`);
      
      this.tableDataLevel2.next(activePatients.slice(0, 10).map((element: any) => {
        const eachElementKeys = Object.keys(element);
        for (const key of eachElementKeys) {
          if (typeof (element[key]) == 'object' && element[key].length) {
            // Preserve arrays for name and telecom as our pipes expect them
            if (key === 'name' || key === 'telecom' || key === 'address') {
              // Keep as array - don't flatten
              continue;
            }
            // Flatten other arrays to first element
            element[key] = element[key][0];
          }
        }
        return element;
      }));
    })

    for (const patientsFilter of this.patientsTableFilterArray) {
      this.patientsFiltersFormControlObject[patientsFilter[0]] = new FormGroup({
        'select': new FormControl()
      }
      )
    }
  }

  /**
   * Filter patients to only include active, non-deceased ones
   */
  private filterActivePatients(patients: any[]): any[] {
    if (!patients) {
      console.log('filterActivePatients: Received null/undefined data');
      return [];
    }
    
    if (!Array.isArray(patients)) {
      console.log('filterActivePatients: Data is not an array:', typeof patients);
      return [];
    }

    if (patients.length === 0) {
      console.log('filterActivePatients: Received empty array');
      return [];
    }

    return patients.filter((patient: any) => {
      if (!patient) {
        console.log('filterActivePatients: Skipping null/undefined patient');
        return false;
      }

      // Check if patient is active (FHIR active field)
      const isActive = patient.active === true;
      
      // Check if patient is not deceased (FHIR deceased fields)
      const isNotDeceased = !patient.deceasedBoolean && !patient.deceasedDateTime;
      
      // Additional check for patient status if available
      const hasValidStatus = !patient.status || patient.status === 'active';
      
      const shouldInclude = isActive && isNotDeceased && hasValidStatus;
      
      // Debug logging for transparency
      if (!shouldInclude) {
        console.log(`Filtering out patient ${patient.id}: active=${patient.active}, deceased=${patient.deceasedBoolean || patient.deceasedDateTime || 'none'}, status=${patient.status || 'none'}`);
      }
      
      return shouldInclude;
    });
  }

  private router = inject(Router);
  private patientRecordHolder = inject(RecordHolderService);
  showRow(row: any) {
    console.log('Row clicked:', row);
    
    // Handle FHIR identifier structure
    const patientId = row.identifier?.value || row.identifier?.[0]?.value || row.id;
    
    if (!patientId) {
      console.error('No patient identifier found in row:', row);
      return;
    }
    
    console.log('Navigating to patient:', patientId);
    
    const segments = [patientId];
    const role = this.auth.user.getValue()?.role;
    if (role === 'lab') {
      segments.push('tests-requests');
    } else if (role === 'pharmacy') {
      segments.push('medications');
    }

    if (this.route.routeConfig?.path?.split('/').includes("admitted-patients")) {
      this.router.navigate(segments, { relativeTo: this.route });
    } else {
      this.router.navigate(segments, { relativeTo: this.route });
    }
  }

  /**
   * Update empty state based on the data scenario from server
   */
  private updateEmptyStateForDataScenario(data: any): void {
    if (!data) {
      // Server returned null/undefined
      this.currentEmptyState = {
        icon: 'wifi_off',
        title: 'Unable to load data',
        subtitle: 'The server did not return any data. Please try refreshing the page or contact support.'
      };
    } else if (Array.isArray(data) && data.length === 0) {
      // Server returned empty array
      this.currentEmptyState = {
        icon: 'database',
        title: 'No patient data available',
        subtitle: 'The server returned no patient records. This could be a new system or all records may have been archived.'
      };
    } else if (Array.isArray(data) && data.length > 0) {
      // Server has data but filtering might make it empty
      this.currentEmptyState = {
        icon: 'people_outline',
        title: 'No active patients found',
        subtitle: 'There are patients in the system, but none match the active/non-deceased criteria.'
      };
    } else {
      // Unexpected data format
      this.currentEmptyState = {
        icon: 'error',
        title: 'Data format error',
        subtitle: 'The server returned data in an unexpected format. Please contact support.'
      };
    }
  }

  /**
   * Check if the data source is empty
   */
  isDataEmpty(): boolean {
    return this.tableDataLevel2.value.length === 0;
  }

}
