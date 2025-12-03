import { Component, inject, Resource } from '@angular/core';
import { commonImports, tablePropInt } from '../../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable, firstValueFrom } from 'rxjs';
import { PatientDetailsKeyService } from '../../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../../shared/error.service';
import { UtilityService } from '../../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { Bundle, BundleEntry, Task } from 'fhir/r4';
import { EncounterServiceService } from '../../patient-wrapper/encounter-service.service';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { baseStatusStyles } from '../../shared/statusUIIcons';
import { LinkInReferencesService } from '../../shared/link-in-references.service';
import { AuthService, capacityObject } from '../../shared/auth/auth.service';
import { fetchFromReferencePipe } from "../../shared/Fetch.pipe";
import { AdmittedPatientsComponent } from '../../admitted-patients/admitted-patients.component';
import { backendEndPointToken } from '../../app.config';
import { StateService } from '../../shared/state.service';

@Component({
  selector: 'app-tasks-table',
  imports: [...commonImports, fetchFromReferencePipe, ReactiveFormsModule],
  templateUrl: './tasks-table.component.html',
  styleUrl: './tasks-table.component.scss'
})
export class TasksTableComponent extends AdmittedPatientsComponent {

  // Access parent services through local references
  private localStateService = this.stateService
  private localHttp = this.http
  private localBackendUrl = this.backendUrl
  private localErrorService = this.errorService;

  // Track current patient ID (will be set in ngOnInit)
  private currentPatientId: string | null = null;

  /**
   * DATA PROCESSING FLOW - Overview of AdmittedPatientsComponent.ngOnInit() processes
   * ====================================================================================
   * 
   * STEP 1: INITIALIZE DATA SOURCE SUBSCRIPTION
   * --------------------------------------------
   * Method: this.inititateDataSourceSubscription(this.stateService.orgWideResources.encounters)
   * Purpose: Subscribe to the encounters observable from StateService and populate tableDataSource
   * Process: Maps each entry to its actualResource and assigns to tableDataSource.data
   * 
   * 
   * STEP 2: APPLY FILTERS TO DATA
   * ------------------------------
   * Method: this.applyFilter(filterKey, filterCallback)
   * 
   * Filter 1 - Status Filter:
   *   Key: 'status'
   *   Callback: (row) => row['status'] === 'in-progress'
   *   Purpose: Only show encounters with status 'in-progress'
   * 
   * Filter 2 - Hospitalization Filter:
   *   Key: 'hospitalization'
   *   Callback: (row) => row['hospitalization'] !== undefined && row['hospitalization'].preAdmissionIdentifier?.value
   *   Purpose: Only show encounters with valid hospitalization and preAdmissionIdentifier
   * 
   * Filter 3 - Class Filter:
   *   Key: 'class'
   *   Callback: (row) => row['class'] && row['class'].code === 'IMP'
   *   Purpose: Only show inpatient encounters (class code 'IMP')
   * 
   * 
   * STEP 3: SORT DATA
   * -----------------
   * Method: this.sortData(['hospitalization.preAdmissionIdentifier.period.start'], false)
   * Purpose: Sort encounters by admission date in descending order (newest first)
   * Sort Key: 'hospitalization.preAdmissionIdentifier.period.start'
   * Direction: false (descending)
   * 
   * 
   * STEP 4: COMBINE REFERENCED RESOURCES
   * -------------------------------------
   * Method: this.combineReferencedResources([{ resourceType: 'Patient', attachKey: 'patientDetails' }], 'subject')
   * Purpose: Fetch and attach Patient resources referenced in encounter.subject
   * Process:
   *   - Extracts all unique Patient references from encounter.subject
   *   - Checks StateService cache first for Patient resources
   *   - Fetches missing Patients from backend if not in cache
   *   - Attaches Patient resource to each row as 'patientDetails' property
   * 
   * 
   * STEP 5: TRANSFORM DATA - EXTRACT WARD/ROOM/BED INFORMATION
   * -----------------------------------------------------------
   * Method: this.transformData((row) => { ... })
   * Purpose: Extract and normalize location data (ward, room, bed) and admission date
   * Transformations:
   *   
   *   a) Extract Admission Date:
   *      Source: row.hospitalization?.preAdmissionIdentifier?.period?.start
   *      Target: row.admittedDate
   *   
   *   b) Extract Location Information from encounter.location array:
   *      - Gets the last location entry (most recent)
   *      - Extracts admission date from location.period?.start
   *      - Finds all locations matching the admission date
   *      - Separates locations into ward/room/bed using physicalType codes:
   *        * 'wa' code or 'ward' in display → Ward
   *        * 'ro' code or 'room' in display → Room
   *        * 'bd' code or 'bed' in display → Bed
   *      - If no physicalType, extracts from location.display directly
   *      - Takes the last (most recent) ward, room, and bed
   *   
   *   c) Returns Enhanced Row:
   *      {
   *        ...row,
   *        admittedDate: ISO date string,
   *        currentWard: string or null,
   *        currentRoom: string or null,
   *        currentBed: string or null
   *      }
   * 
   * 
   * STEP 6: ORGANIZE SEARCH FILTERS FOR UI
   * ---------------------------------------
   * Method: this.organizingSearchFilters(new Map([['ward', ['ICU', 'General', 'Pediatrics', 'Maternity']]]))
   * Purpose: Setup filter form controls for table header search UI
   * Process:
   *   - Creates FormGroup for each filter category
   *   - Adds FormControl for each filter value (initialized as false checkboxes)
   *   - Stores in tableHeaderFiltersFormControlObject
   * 
   * 
   * FINAL RESULT:
   * =============
   * tableDataSource.data contains:
   *   - Filtered encounters (in-progress, hospitalized, inpatient only)
   *   - Sorted by admission date (newest first)
   *   - Enhanced with patientDetails from referenced Patient resources
   *   - Transformed with extracted admittedDate, currentWard, currentRoom, currentBed
   *   - Ready for table display with filter UI controls
   */

  override ngOnInit(): void {
    // Use the reactive currentPatientId$ observable from StateService (inherited from parent)
    // This is more reliable than route params as it's centrally managed
    firstValueFrom(this.localStateService.currentPatientId$).then(patientId => {
      this.currentPatientId = patientId;

      if (this.currentPatientId) {
        // PATIENT-SPECIFIC MODE: Use PatientResources
        console.log('Patient ID found:', this.currentPatientId, '- Using PatientResources');
        this.loadPatientSpecificTasks();
      } else {
        // ORG-WIDE MODE: Use orgWideResources
        console.log('No patient ID - Using orgWideResources');
        this.loadOrgWideTasks();
      }
    });
  }

  /**
   * Load tasks for a specific patient from PatientResources
   */
  private loadPatientSpecificTasks(): void {
    const currentTasks = this.localStateService.PatientResources.tasks.getValue();

    if (!currentTasks || currentTasks.length === 0) {
      // Fetch patient-specific tasks from backend if not in PatientResources
      console.log('Patient tasks not found in PatientResources, fetching from backend...');
      this.localHttp.get<Bundle>(`${this.localBackendUrl}/Task?for=Patient/${this.currentPatientId}&_count=200&_sort=-_lastUpdated`)
        .pipe(
          map(bundle => bundle.entry?.map(e => ({
            referenceId: `Task/${e.resource?.id}` as string | null,
            savedStatus: 'saved' as 'saved' | 'unsaved',
            actualResource: e.resource as Task
          })) || [])
        )
        .subscribe({
          next: (tasks) => {
            // Add fetched tasks to PatientResources
            this.localStateService.PatientResources.tasks.next(tasks);
            console.log('Patient tasks loaded into PatientResources:', tasks);

            // Now subscribe to the data source
            this.inititateDataSourceSubscription(this.localStateService.PatientResources.tasks);
            this.applyTaskFiltersAndTransforms();
          },
          error: (err) => {
            this.localErrorService.openandCloseError('Failed to load patient tasks: ' + err);
          }
        });
    } else {
      // Tasks already in PatientResources, use them directly
      console.log('Using existing patient tasks from PatientResources');
      this.inititateDataSourceSubscription(this.localStateService.PatientResources.tasks);
      this.applyTaskFiltersAndTransforms();
    }
  }

  /**
   * Load all organization-wide tasks from orgWideResources
   */
  private loadOrgWideTasks(): void {
    const currentTasks = this.localStateService.orgWideResources.tasks.getValue();

    if (!currentTasks || currentTasks.length === 0) {
      // Fetch org-wide tasks from backend if not in orgWideResources
      console.log('Org-wide tasks not found in orgWideResources, fetching from backend...');
      this.localHttp.get<Bundle>(`${this.localBackendUrl}/Task?_count=200&_sort=-_lastUpdated`)
        .pipe(
          map(bundle => bundle.entry?.map(e => ({
            referenceId: `Task/${e.resource?.id}` as string | null,
            savedStatus: 'saved' as 'saved' | 'unsaved',
            actualResource: e.resource as Task
          })) || [])
        )
        .subscribe({
          next: (tasks) => {
            // Add fetched tasks to orgWideResources
            this.localStateService.orgWideResources.tasks.next(tasks);
            console.log('Org-wide tasks loaded into orgWideResources:', tasks);

            // Now subscribe to the data source
            this.inititateDataSourceSubscription(this.localStateService.orgWideResources.tasks);
            this.applyTaskFiltersAndTransforms();
          },
          error: (err) => {
            this.localErrorService.openandCloseError('Failed to load org-wide tasks: ' + err);
          }
        });
    } else {
      // Tasks already in orgWideResources, use them directly
      console.log('Using existing org-wide tasks from orgWideResources');
      this.inititateDataSourceSubscription(this.localStateService.orgWideResources.tasks);
      this.applyTaskFiltersAndTransforms();
    }
  }

  private applyTaskFiltersAndTransforms(): void {
    // STEP 2: Apply filters (customize for Task-specific filters)
    // Example: Filter by task status
    this.applyFilter('status', (row) => {
      // Show tasks that are not completed or cancelled
      return row['status'] !== 'completed' && row['status'] !== 'cancelled';
    });

    // STEP 3: Sort by executionPeriod.start or authoredOn (descending - newest first)
    this.sortData(['executionPeriod.start', 'authoredOn'], false);

    // STEP 4: Combine referenced resources
    // Attach Patient details from task.for reference
    this.combineReferencedResources(
      [
        { resourceType: 'Patient', attachKey: 'patientDetails' }
      ],
      'for'
    );

    // STEP 5: Transform data to extract relevant task information
    this.transformData((row) => {
      return {
        ...row,
        startDate: row.executionPeriod?.start || row.authoredOn,
        dueDate: row.executionPeriod?.end,
        taskName: row.description || row.code?.text || 'N/A',
        assignedTo: row.owner?.display || 'Unassigned'
      };
    });

    // STEP 6: Organize search filters for UI
    this.organizingSearchFilters(new Map<string, any[]>([
      ['status', ['draft', 'requested', 'received', 'accepted', 'in-progress', 'on-hold']],
      ['intent', ['order', 'plan', 'proposal']],
    ]));
  }

}
