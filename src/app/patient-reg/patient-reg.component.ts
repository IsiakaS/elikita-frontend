import { Component, inject } from '@angular/core';
import { tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, forkJoin, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { commonImports } from '../shared/table-interface';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Bundle, Patient } from 'fhir/r4';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { baseStatusStyles } from '../shared/statusUIIcons';
// Removed unused detail/dynamic form related imports for lint cleanliness
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { PatientRegistrationDetailsComponent } from '../patient-registration-details/patient-registration-details.component';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { AuthService } from '../shared/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientRegistrationCenterStore } from '../patient-registration-center/patient-registration-center.store';
import { PatientRegistrationEditComponent } from '../patient-registration-edit/patient-registration-edit.component';


// Removed unused FormFields typing (not used in template or logic)
type PatientRegData = Patient & { status: string };
@Component({
  selector: 'app-patient-reg',
  imports: [...commonImports,
    MatProgressSpinnerModule, CommonModule, EmptyStateComponent
  ],
  templateUrl: './patient-reg.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './patient-reg.component.scss']
})
export class PatientRegComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  // Track current route segment (e.g. 'pending', 'approved', 'deceased') for contextual UI logic
  currentSegment: string = 'pending';
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: Patient[];
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([]);
  references!: Map<string, any>;
  tableFilter!: Map<string, any[]>;
  tableFilterFormControlObject: { [key: string]: FormGroup<any>; } | any = {};
  patientName!: Observable<string | null>;
  patientId!: string | null;
  tableColumns!: string[];
  http: HttpClient = inject(HttpClient);
  patientOpenAndClose: PatientDetailsKeyService = inject(PatientDetailsKeyService);
  router: Router = inject(Router);
  store = inject(PatientRegistrationCenterStore, { optional: true });
  pageTitle = '';
  pageSubtitle = '';
  getPatientName(): void {
    if (!this.getPatientId()) return;
    this.patientName = this.utilityService.getPatientName(this.getPatientId)
  }
  getPatientId(): string | null {
    return this.patientId = this.route.parent?.snapshot.params['id'];
  }
  connectTableDataSource(): void {
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2
    }
  }
  isLinkObj: { [key: string]: Map<any, any> } = {}
  subscribeToResolver(): void {
    // Replaced: now subscribe to shared store (parent resolver already populated it)
    if (!this.store) return; // fallback if used standalone somewhere else
    const segment$ = this.route.url.pipe(
      map(segs => segs?.[0]?.path || this.route.snapshot.routeConfig?.path || 'pending'),
      distinctUntilChanged()
    );
    combineLatest([this.store.patients$, segment$]).subscribe(([patients, segment]) => {
      // Persist the segment for template conditional rendering of action menu items
      this.currentSegment = segment;
      // derive status and filter based on current path segment
      const enriched: PatientRegData[] = patients.map(p => ({ ...p, status: p.active === true ? 'approved' : 'pending' }));
      let filtered: PatientRegData[] = [];
      if (segment === 'pending') {
        this.pageTitle = 'Pending Patient Registrations';
        this.pageSubtitle = 'Review, approve or reject patients that are not yet active.';
        filtered = enriched.filter(p => p.active !== true && !(p as any).deceasedBoolean && !(p as any).deceasedDateTime);
      } else if (segment === 'approved') {
        this.pageTitle = 'Approved Patients';
        this.pageSubtitle = 'All active patients approved from registration.';
        filtered = enriched.filter(p => p.active === true && !(p as any).deceasedBoolean && !(p as any).deceasedDateTime);
      } else if (segment === 'deceased') {
        this.pageTitle = 'Deceased Patients';
        this.pageSubtitle = 'Patients marked as deceased.';
        filtered = enriched.filter(p => (p as any).deceasedBoolean === true || !!(p as any).deceasedDateTime);
      } else {
        this.pageTitle = 'Patient Registrations';
        this.pageSubtitle = '';
        filtered = enriched;
      }
      this.immutableLevelTableData = filtered;
      this.tableDataLevel2.next(filtered);
    });
  }

  ngOnInit() {
    this.tableFilter = new Map([[
      'gender', ['male', 'female',],

    ],
    ['status', ['approved', 'pending']]
    ])

    this.tableColumns = [

      'name',
      'gender',
      'contact',
      'date of birth',
      'address',
      'status',
      'action',

    ]
    this.getPatientId();
    this.getPatientName();
    this.connectTableDataSource();
    this.subscribeToResolver();

    if (this.tableFilter) {
      for (const [key, value] of this.tableFilter) {
        this.tableFilterFormControlObject[key] = new FormGroup({});
        for (const filterValue of value) {
          this.tableFilterFormControlObject[key].addControl(filterValue, new FormControl(false));
        }
      }
    }
  }
  dialog: MatDialog = inject(MatDialog);
  errorService: ErrorService = inject(ErrorService);
  showRow(row: any): void {
    console.log(row);
  }

  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }




  viewDetails(element: any) {
    console.log(element);
    const ref = this.dialog.open(PatientRegistrationDetailsComponent,

      {
        maxHeight: '93vh',
        data: this.stripSyntheticFields(element)

      });
    ref.afterClosed().subscribe((result) => {
      if (result?.approved && result?.id && this.store) {
        this.store.updatePatient({ id: result.id, resourceType: 'Patient', active: true } as Patient);
      } else if (result?.rejected && result?.id && this.store) {
        this.store.removePatient(result.id);
        this._sn.openFromComponent(SuccessMessageComponent, {
          data: { message: 'Patient registration rejected and record deleted.', action: 'Close' },
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }

  editPatient(element: Patient) {
    const ref = this.dialog.open(PatientRegistrationEditComponent, {
      data: this.stripSyntheticFields(element),
      width: '720px',
      maxWidth: '92vw',
      maxHeight: '93vh'
    });
    ref.afterClosed().subscribe(result => {
      if (result?.updated) {
        // New path: dialog returns full resource
        const resource: Patient | undefined = result.resource as Patient | undefined;
        const toSave: Patient = resource ?? {
          // Back-compat path if only patch was returned (older dialog versions)
          ...element,
          name: [{
            ...(element.name?.[0] || {}),
            family: result.patch?.family ?? element.name?.[0]?.family,
            given: [result.patch?.given ?? element.name?.[0]?.given?.[0] ?? '']
          }]
        } as Patient;

        // Ensure no UI-only synthetic fields (like 'status') are sent to server
        delete (toSave as any).status;

        const baseUrl = 'https://elikita-server.daalitech.com';
        this.http.put<Patient>(`${baseUrl}/Patient/${element.id}`, toSave, {
          headers: { 'Content-Type': 'application/fhir+json' }
        }).subscribe({
          next: (saved) => {
            this.store?.updatePatient(saved);
            this._sn.openFromComponent(SuccessMessageComponent, {
              data: { message: 'Patient updated successfully.', action: 'Close' },
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          },
          error: () => this.errorService.openandCloseError('Failed to update patient')
        });
      }
    });
  }
  approve() {
    // Legacy method not used anymore; approval happens inside the details dialog
  }
  _sn = inject(MatSnackBar);
  auth = inject(AuthService);

  canAddPatientRegistration(): boolean {
    return this.auth.can('patient', 'add');
  }

  private stripSyntheticFields(p: any): Patient {
    // Remove UI-only fields such as 'status' before passing to dialogs or saving
    const { status, ...rest } = p || {};
    return rest as Patient;
  }

}
