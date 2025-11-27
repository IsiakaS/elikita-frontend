import { Component, inject, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, UrlSegment } from '@angular/router';
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
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { Bundle, BundleEntry, ServiceRequest } from 'fhir/r4';
import { References2Pipe } from "../shared/references2.pipe";
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { CodeableRef2Pipe } from "../shared/codeable-ref2.pipe";
import { CodeableConcept2Pipe } from "../shared/codeable-concept2.pipe";
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { UtilityService } from '../shared/utility.service';
import { SpecimenComponent } from '../specimen/specimen_old.component';
import { SpecimenDetailsComponent } from '../specimen/specimen-details/specimen-details.component';
import { LabrequestDetailsComponent } from '../labrequest-details/labrequest-details.component';
import { LabreportComponent } from '../labreport/labreport.component';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
import { StateService } from '../shared/state.service';
import { ErrorService } from '../shared/error.service';
import { Resource } from 'fhir/r4';
import { ChipsDirective } from "../chips.directive";
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { NaPipe } from "../shared/na.pipe";
import { EmptyStateComponent } from "../shared/empty-state/empty-state.component";
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { DetailzViewzComponent, DetailActionButton } from '../detailz-viewz/detailz-viewz.component';
import { AddSpecimenComponent } from '../specimen/add-specimen/add-specimen.component';
import { FhirResourceTransformService } from '../shared/fhir-resource-transform.service';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { backendEndPointToken } from '../app.config';
import { Observation } from 'fhir/r4';
@Component({
  selector: 'app-lab-requests',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, DetailBaseComponent,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive, CommonModule, ReferenceDisplayDirective,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule, MatMenuModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule, References2Pipe, fetchFromReferencePipe, CodeableRef2Pipe, CodeableConcept2Pipe, ChipsDirective, NaPipe, EmptyStateComponent],
  templateUrl: './lab-requests.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './lab-requests.component.scss']
})
export class LabRequestsComponent implements OnInit {
  auth = inject(AuthService);
  labRequestsData: any;
  labRequests?: ServiceRequest[]
  sortedWithRequisition: { [key: string]: ServiceRequest[] } = {};
  sortedWithRequisitionKeys: string[] = [];
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  references: Map<string, any> = new Map();
  @Input() forCheckSheet?: boolean

  // status  - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-status&_format=json

  // intent - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-intent&_format=json

  // priority - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-priority&_format=json

  // code  - filter - http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/procedure-code&_FORMAT=JSON&filter=blood%20sugar

  // orderDetail.parameter.code - (form your own)

  // orderDetail.parameter.valueString - textarea

  // subject

  // authoredOn

  // requester

  //performer-type - http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/participant-role&_FORMAT=JSON

  labRequestsTableFilter: Map<string, any[]> = new Map([[
    'priority', ['ASAP', 'Urgent', 'Routine']
  ],
  [
    'status', ['active', 'completed', 'cancelled', 'entered-in-error', 'unknown']
  ],


  ])



  labRequestsTableFilterArray = this.labRequestsTableFilter;
  labRequestsFiltersFormControlObject: any = {};
  // patientName!: Observable<string>;
  // patientId!: string;
  private readonly baseDisplayedColumns = [
    'requisition',
    'authoredOn',
    'status',
    'priority',
    'code',
    'action',
    // 'groupReport'
  ];
  labRequestsDisplayedColumns = [...this.baseDisplayedColumns];
  @Input() set labRequestTableColumns(columns: string[] | undefined) {
    this.labRequestsDisplayedColumns = columns?.length ? [...columns] : [...this.baseDisplayedColumns];
  }
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  encounterService = inject(EncounterServiceService);

  referenceObject: any = {}

  constructor(private router: Router) {
  }
  userRole = this.auth.user?.getValue()?.role || 'non_user';
  utilityService = inject(UtilityService);
  capacityObject = capacityObject;
  user: any = null;
  patientId: string | null = null;
  patientname: string | null = null;
  canAddRequests$ = this.auth.user.pipe(
    map(user => {
      return this.auth.can('labRequest', 'add');
    })
  );
  canExportRequests$ = this.auth.user.pipe(
    map(user => {
      return this.auth.can('labRequest', 'viewAll');
    })
  );
  stateService = inject(StateService);
  errorService = inject(ErrorService);
  state = inject(StateService);
  private useOrgWideServiceRequests = false;

  @Input() set labRequestTableFilters(filters: Array<{ field: string; values?: any[] }> | undefined) {
    // alert(filters);
    this.appliedLabRequestFilters = (filters || []).filter(Boolean);
    // alert(JSON.stringify(this.appliedLabRequestFilters));
    this.pushFilteredLabRequests();
  }
  private appliedLabRequestFilters: Array<{ field: string; values?: any[] }> = [];
  private rawLabRequests: any[] = [];

  ngOnInit() {

    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['labRequest']['request'].push('testing');

      }

    })


    // this.patientId = this.utilityService.getPatientIdFromRoute();

    const resolvedPatientId = this.stateService.currentPatientIdFromResolver.getValue();
    const encounterPatientId = this.stateService.currentEncounter.getValue()?.patientId ?? null;
    const canViewAllLabRequests = this.auth.can('labRequest', 'viewAll');

    if (!resolvedPatientId && !encounterPatientId) {
      if (!canViewAllLabRequests) {
        this.errorService.openandCloseError("No patient selected. Please select a patient to view lab requests.");
        this.router.navigate(['/app/patients']);
        return;
      }
      this.useOrgWideServiceRequests = true;
      this.patientId = null;
      this.baseDisplayedColumns.splice(5, 0, 'subject')
      this.labRequestsDisplayedColumns = [...this.baseDisplayedColumns];
    } else {
      this.patientId = resolvedPatientId ?? encounterPatientId;
      this.labRequestsDisplayedColumns = [...this.baseDisplayedColumns];
    }

    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }

    for (const [key, value] of this.labRequestsTableFilter) {
      this.labRequestsFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.labRequestsFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    // this.route.data.pipe(
    // tap((data) => {
    //   console.log(data)

    //   data['labRequests'].filter((e: any) => {
    //     if (!e.requestedPeriod) {
    //       return false
    //     } else {
    //       return true;
    //     }
    //   }).forEach((element: any) => {


    //   })

    // }),
    // map((data) => {
    //   const toReturnData = {
    //     ...data, labRequests: data['labRequests'].filter((e: any) => {
    //       console.log(Object.keys(e), e.hasOwnProperty("code"));
    //       return e.hasOwnProperty("code")
    //     })
    //   }
    //   console.log(toReturnData);
    //   return toReturnData;
    // })

    const serviceRequestsSource = this.useOrgWideServiceRequests
      ? this.stateService.orgWideResources.serviceRequests
      : this.stateService.PatientResources.serviceRequests;

    serviceRequestsSource.subscribe((allData) => {
      allData = allData
        .filter((r: any) => {
          console.log(r);
          return r.actualResource.category &&
            r.actualResource.category.some((c: any) => {
              return c.text?.trim()?.toLowerCase() === 'laboratory' ||
                c.coding?.some((cc: any) => cc.code?.trim()?.toUpperCase().includes('LAB') || cc.display?.trim()?.toLowerCase().includes('laboratory'));
            });
        })
        .reverse();
      // this.rawLabRequests = allData.map((e: any) => e.actualResource);
      console.log(allData)


      this.labRequests = allData.map((e: any) => e.actualResource) //.slice(0, 5);

      //   //  this.references = new Map(allData['patMed']['references']);
      //   //  console.log(this.references);
      //   .entry?.map((e: BundleEntry, index: any) => {
      //     for (const [key, value] of Object.entries(e.resource as ServiceRequest)) {
      //       console.log(value.reference);
      //       if (this.isLinkObj.hasOwnProperty(key)) {
      //         this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
      //       } else {
      //         this.isLinkObj[key] = new Map();
      //         this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
      //       }
      //       console.log(this.isLinkObj[key]);

      //     }
      //     return e.resource as ServiceRequest
      //   });
      const sortedAccRequisition: { [key: string]: ServiceRequest[] } = {}
      this.labRequests?.forEach((e: ServiceRequest) => {
        if (e.hasOwnProperty('requisition') && e.requisition?.hasOwnProperty('value')) {
          if (!sortedAccRequisition.hasOwnProperty(e.requisition!.value!)) {
            sortedAccRequisition[e.requisition!.value!] = [];
          }
          sortedAccRequisition[e.requisition!.value!].push(e);
          // e['requisition-key'] = e.requisition!.value!;
        } else {
          sortedAccRequisition['N/A'] = sortedAccRequisition['N/A'] || [];
          sortedAccRequisition['N/A'].push(e);
        }
        this.sortedWithRequisition = sortedAccRequisition;
      })
      console.log(sortedAccRequisition);
      this.sortedWithRequisitionKeys = Object.keys(sortedAccRequisition);
      console.log(this.sortedWithRequisitionKeys);
      this.labRequestsData = [];
      Object.values(sortedAccRequisition)
        .forEach((e: ServiceRequest[]) => {
          this.labRequestsData!.push(...e);
        });
      this.rawLabRequests = this.labRequestsData || [];
      this.pushFilteredLabRequests();
    });
  }

  dialog = inject(MatDialog)

  detailsBuilder: DetailsBuilderObject = {
    resourceName: 'Lab Request',
    resourceIcon: 'biotech',
    specialHeader: {
      strongSectionKey: 'code',
      iconSectionKeys: ['status', 'priority'],
      contentSectionKeys: ['subject', 'authoredOn']
    },
    groups: [
      { groupName: 'Classification', groupIcon: 'category', groupKeys: ['status', 'intent', 'priority', 'performerType'] },
      { groupName: 'Participants', groupIcon: 'group', groupKeys: ['subject', 'requester', 'performer'] },
      { groupName: 'Clinical Details', groupIcon: 'science', groupKeys: ['code', 'reasonCode', 'note'] },
      { groupName: 'Logistics', groupIcon: 'calendar_today', groupKeys: ['authoredOn', 'requisition'] }
    ]
  };

  showRow(row: ServiceRequest) {
    const dialogRef = this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '90vh',
      data: {
        resourceData: row,
        detailsBuilderObject: this.detailsBuilder,
        actionButtons: this.buildLabRequestActions()
      }
    });

    const sub = dialogRef.componentInstance?.actionInvoked.subscribe(({ key }) => {
      this.handleDetailAction(key, row);
    });
    dialogRef.afterClosed().subscribe(() => sub?.unsubscribe());
  }

  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }

  isLinkObj: { [key: string]: Map<number, string | null> } = {};
  islink = inject(LinkInReferencesService)

  showSpecimenForThisTest() {
    // alert(this.utilityService.getPatientIdFromRoute() || this.patientId);
    this.dialog.open(SpecimenDetailsComponent, {
      maxWidth: '450px',
      maxHeight: '90vh',
      panelClass: 'visible-overflow',
      data: {
        specimenDetails: null,

      }

    })
  }
  showResultsForThisTest(element: ServiceRequest) {
    // alert("Show Results for this test");
    console.log(element);

  }
  showDetails(element: ServiceRequest) {
    // alert("Show Details for this test");
    console.log(element);
    this.dialog.open(LabrequestDetailsComponent, {
      maxWidth: '450px',
      maxHeight: '90vh',
      panelClass: 'visible-overflow',
      data: {
        serviceRequest: element,
        patientId: this.utilityService.getPatientIdFromRoute() || this.patientId,

      }
    })
  }

  showReport() {
    // alert("Show Report for this test");
    console.log("Show Report for this test");
    this.dialog.open(LabreportComponent, {
      maxWidth: '900px',
      maxHeight: '90vh',

    })
  }
  addLabResults(patientId: string | null = null, serviceRequest?: ServiceRequest) {
    if (serviceRequest && serviceRequest.status === 'active') {
      const resolvedPatientId = patientId ?? (serviceRequest ? this.extractPatientId(serviceRequest) ?? null : null);
      this.dialog.open(AddObservationComponent, {
        maxHeight: '90vh',
        maxWidth: '650px',
        autoFocus: false,
        data: {
          isAnyCategory: false,
          observationCategoryValue: "laboratory",
          patientId: resolvedPatientId,
          serviceRequest
        }
      })
    } else {
      this.errorService.openandCloseError('Cannot add results to a lab request that is not active.');
    }
  }
  private snackBar = inject(MatSnackBar);
  private buildLabRequestActions(): DetailActionButton[] {
    return [
      {
        key: 'addSpecimen',
        label: 'Add Specimen',
        icon: 'science',
        color: 'primary',
        capabilities: [{ resource: 'specimen', action: 'add' }]
      },
      //view results
      {
        key: 'viewResults',
        label: 'View Results',
        icon: 'visibility',
        color: 'primary',
        capabilities: [{ resource: 'observation', action: 'view' }]
      },
      {
        key: 'addResult',
        label: 'Add Result',
        icon: 'biotech',
        color: 'accent',
        capabilities: [{ resource: 'observation', action: 'add' }]
      },
      {
        key: 'changeStatus',
        label: 'Change Status',
        icon: 'sync',
        color: 'warn',
        capabilities: [{ resource: 'labRequest', action: 'update' }]
      }
    ];
  }

  private handleDetailAction(actionKey: string, row: ServiceRequest) {
    switch (actionKey) {
      case 'addSpecimen':
        this.launchSpecimenDialog(row);
        break;
      case 'addResult':
        this.launchResultDialog(row);
        break;
      case 'changeStatus':
        this.promptStatusChange(row);
        break;
      case 'viewResults':
        this.launchViewResultsDialog(row);
        break;
      default:
        break;
    }
  }

  private promptStatusChange(row: ServiceRequest) {
    const label = row?.id ?? 'request';
    this.snackBar.open(`Change status clicked for ${label}`, 'Dismiss', { duration: 2500 });
  }
  authService = inject(AuthService);
  fhirTransformService = inject(FhirResourceTransformService);
  fhirResourceService = inject(FhirResourceService)
  private launchSpecimenDialog(row: ServiceRequest) {
    const patientId = this.extractPatientId(row);
    const dialogRef = this.dialog.open(AddSpecimenComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      autoFocus: false,
      data: { patientId, serviceRequestId: row.id }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !result.values || (Array.isArray(result.values) && result.values.length === 0)) {
        this.errorService.openandCloseError('No Specimen was created as the form was closed without submission.');
        return;
      }

      let values = result.values;
      if (!Array.isArray(values)) {
        values = [values];
      }

      const practitionerId = this.authService.user.getValue()?.['userId'];
      const practitionerRef = practitionerId ? `Practitioner/${practitionerId}` : null;

      const specimenResources = values.map((val: any) => {
        const resource: any = {
          ...this.fhirTransformService.transformValues('Specimen', val),
          resourceType: 'Specimen'
        };
        if (practitionerRef) {
          resource.collection = {
            ...(resource.collection || {}),
            collector: { reference: practitionerRef }
          };
        }
        resource.status = resource.status?.toLowerCase();
        //  return resource;
        return resource;
      });

      const bundle: Bundle<any> = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: specimenResources.map((resource: any) => ({
          resource,
          request: { method: 'POST', url: 'Specimen' }
        }))
      };

      this.fhirResourceService.postBundle(bundle).subscribe({
        next: (response) => {
          const persistedResources =
            response?.bundle?.entry?.map((entry: any) => entry.resource).filter(Boolean) ?? specimenResources;

          persistedResources.forEach((resource: any) => {
            this.stateService.persistOrgWideResource(resource, 'saved');
            if (patientId) {
              this.stateService.persistPatientResource(resource, 'saved');
            }
          });

          this.snackBar.openFromComponent(SuccessMessageComponent, {
            data: { message: 'Specimen record(s) created successfully.' },
            duration: 3000
          });
        },
        error: () => {
          this.errorService.openandCloseError('Error creating specimen record(s). Please try again later.');
        }
      });
    });
    // this.encounterService.addSpecimen(patientId, row.id);
  }
  private launchResultDialog(row: ServiceRequest) {
    const patientId = this.extractPatientId(row) ?? this.patientId;
    this.addLabResults(patientId || null, row);
  }

  private extractPatientId(row: ServiceRequest): string | undefined {
    const ref = row.subject?.reference || '';
    const [, id] = ref.split('/');
    return id || undefined;
  }

  private pushFilteredLabRequests() {
    const filtered = this.applyLabRequestFilters(this.rawLabRequests);
    this.tableDataLevel2.next(filtered);
  }

  private applyLabRequestFilters(items: any[]): any[] {
    if (!this.appliedLabRequestFilters.length) return items;
    return items.filter((item) =>
      this.appliedLabRequestFilters.every((filter) => {
        const value = this.getNestedFieldValue(item, filter.field);
        // alert(value);
        // alert(filter.value);
        if (!filter.values?.length) return true;
        return filter.values.includes(value);
      })
    );
  }

  private getNestedFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, segment) => (curr ? curr[segment] : undefined), obj);
  }

  private readonly backendEndPoint = inject(backendEndPointToken);

  private launchViewResultsDialog(row: ServiceRequest) {
    // const reference = (row.basedOn ?? []).find((ref) => ref.reference?.startsWith('Observation/'))?.reference;
    // // if (!reference) {
    //   this.errorService.openandCloseError('No linked observation was found for this request.');
    //   return;
    // }
    // const [, observationId] = reference.split('/');
    // if (!observationId) {
    //   this.errorService.openandCloseError('Invalid observation reference.');
    //   return;
    // }
    const observationId = row.id || '';

    this.http.get<Observation>(`${this.backendEndPoint}/Observation?_count=1000`).pipe(
      map((observation: any) => {
        if (!observation) {
          throw new Error('Observation not found');
        }
        const obes: Bundle<Observation> = observation;
        return obes.entry?.map(e => e.resource).find((obs: any) => obs.basedOn?.some((basedOnRef: any) => basedOnRef.reference === `ServiceRequest/${row.id}`))!;
        // observation.entries.find((obs: Observation) => obs.basedOn?.includes(observationId))!;
      })
    ).subscribe({
      next: (observation) => {
        this.dialog.open(DetailzViewzComponent, {
          maxHeight: '93vh',
          maxWidth: '90vh',
          data: {
            resourceData: observation,
            detailsBuilderObject: this.buildObservationDetailsBuilder(observation)
          }
        });
      },
      error: () => {
        this.errorService.openandCloseError('Unable to load the lab result at this time.');
      }
    });
  }

  private buildObservationDetailsBuilder(observation: Observation): DetailsBuilderObject {
    return {
      resourceName: 'Lab Result',
      resourceIcon: 'visibility',
      specialHeader: {
        strongSectionKey: 'code',
        iconSectionKeys: ['status'],
        contentSectionKeys: ['subject', 'effectiveDateTime']
      },
      groups: [
        { groupName: 'Classification', groupIcon: 'category', groupKeys: ['status', 'category', 'code'] },
        { groupName: 'Value', groupIcon: 'show_chart', groupKeys: ['valueQuantity', 'valueString', 'valueCodeableConcept'] },
        { groupName: 'Related Data', groupIcon: 'history_edu', groupKeys: ['issued', 'performer', 'note'] }
      ]
    };
  }
}
