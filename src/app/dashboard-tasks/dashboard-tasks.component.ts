import { Component, inject, Input, Resource } from '@angular/core';
import { commonImports, tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { Bundle, BundleEntry, Task } from 'fhir/r5';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';

import { baseStatusStyles } from '../shared/statusUIIcons';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { TaskDetailsComponent } from '../tasks/task-details/task-details.component';

@Component({
  selector: 'app-dashboard-tasks',
  imports: [...commonImports, fetchFromReferencePipe, ReactiveFormsModule],
  templateUrl: './dashboard-tasks.component.html',
  styleUrls: ['../tasks/tasks-table/tasks-table.component.scss',]
})
export class DashboardTasksComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  encounterService = inject(EncounterServiceService)
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute)
  immutableLevelTableData: any[] = [];
  tableDataSource = new MatTableDataSource<any>();
  @Input() neededHeader: boolean = true;
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([]);
  references!: Map<string, any>;
  tableFilter: Map<string, any[]> = new Map([
    //task status
    ['status', ['completed', 'draft', 'accepted', 'received', 'in-progress',

      'on-hold', 'cancelled', 'rejected', 'failed',
    ]],
    //task type


  ])
  tableFilterFormControlObject: { [key: string]: FormGroup<any>; } = {};
  patientName!: Observable<string | null>;
  patientId!: string | null;
  tableColumns: string[] = [
    'type', 'for', 'status', 'actions'
  ]
  http: HttpClient = inject(HttpClient);
  patientOpenAndClose: PatientDetailsKeyService = inject(PatientDetailsKeyService);
  getPatientName(): void {
    if (!this.getPatientId()) return;
    this.patientName = this.utilityService.getPatientName(this.getPatientId)
  }

  getPatientId(): string | null {
    return this.patientId = this.route.parent?.snapshot.params['id'] || this.utilityService.getPatientIdFromRoute();
  }
  connectTableDataSource(): void {
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2
    }
  }
  islink = inject(LinkInReferencesService);
  isLinkObj: { [key: string]: Map<any, any> } = {}
  subscribeToResolver(): void {
    this.http.get<Bundle<Task>>("/task.json").pipe(
      map((e: any) => {
        return e.entry.filter((f: any) => {
          console.log(f)
          return f.resource.hasOwnProperty('focus');
        })
      })

    ).subscribe((data: BundleEntry<Task>[]) => {
      this.immutableLevelTableData = data.map((entry, index) => {
        for (const [key, value] of Object.entries(entry.resource as Task)) {
          if (this.isLinkObj.hasOwnProperty(key)) {
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          } else {
            this.isLinkObj[key] = new Map();
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          }
        }

        return entry.resource
      }) || [];
      this.tableDataSource.data = this.immutableLevelTableData;
      this.tableDataLevel2.next(this.immutableLevelTableData);


      // this.references = this.utilityService.getReferencesFromBundle(data);
      console.log(this.immutableLevelTableData);
    });

  }
  auth = inject(AuthService);
  user?: any

  ngOnInit() {
    this.getPatientId();
    this.getPatientName();
    this.connectTableDataSource();
    this.subscribeToResolver();
    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['medicationRequest']['request'].push('testing');

      }

    })

    for (const [key, value] of this.tableFilter) {
      this.tableFilterFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.tableFilterFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }
  }
  dialog: MatDialog = inject(MatDialog);
  errorService: ErrorService = inject(ErrorService);
  showRow(row: any): void {
    this.dialog.open(TaskDetailsComponent, {
      data: row
    });
  }
  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }

}
