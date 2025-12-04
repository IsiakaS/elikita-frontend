import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CodeSystem } from 'fhir/r4';
import { capacityObject } from '../shared/auth/auth.service';
import { AdmittedPatientsComponent } from '../admitted-patients/admitted-patients.component';
import { ChipsDirective } from '../chips.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { NaPipe } from '../shared/na.pipe';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';

@Component({
  selector: 'app-service-request-codes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    ChipsDirective,
    EmptyStateComponent,
    TableHeaderComponent,
    CodeableConcept2Pipe,
    NaPipe,
    ReferenceDisplayDirective
  ],
  templateUrl: './service-request-codes-list.component.html',
  styleUrls: ['../patient-observation/patient-observation.component.scss', './service-request-codes-list.component.scss']
})
export class ServiceRequestCodesListComponent extends AdmittedPatientsComponent implements OnInit, OnDestroy {
  // Permission observables
  canAddServiceCode$ = new BehaviorSubject<boolean>(false);
  canExportServiceCode$ = new BehaviorSubject<boolean>(false);

  // Table setup - reusing inherited tableDataSource if available
//   override tableDataSource = new MatTableDataSource<CodeSystem>([]);
//   override tableDataLevel2 = new BehaviorSubject<CodeSystem[]>([]);
  override displayedColumns: string[] = ['title', 'status', 'purpose', 'count', 'meta', 'actions'];

  // Raw data
  serviceCodesData: CodeSystem[] = [];

  // Filters - following AdmittedPatientsComponent pattern
  serviceCodeTableFilter: Map<string, any[]> = new Map([
    ['status', ['draft', 'active', 'retired', 'unknown']]
  ]);

  serviceCodeTableFilterArray = this.serviceCodeTableFilter;
  serviceCodeFiltersFormControlObject: any = {};

  // Details builder for dialog
  serviceCodeDetailsBuilder: DetailsBuilderObject = {
    resourceName: 'Service Code',
    resourceIcon: 'science',
    specialHeader: {
      strongSectionKey: 'title',
      iconSectionKeys: ['status'],
      contentSectionKeys: ['purpose', 'count']
    },
    groups: [
      {
        groupName: 'Basic Information',
        groupIcon: 'info',
        groupKeys: ['title', 'status', 'description', 'purpose']
      },
      {
        groupName: 'Technical Details',
        groupIcon: 'settings',
        groupKeys: ['url', 'version', 'name', 'publisher']
      },
      {
        groupName: 'Concepts',
        groupIcon: 'list',
        groupKeys: ['count', 'content', 'caseSensitive']
      }
    ]
  };

  override ngOnInit(): void {
    // Call parent ngOnInit if it exists
    super.ngOnInit?.();

    // Compute permissions for 'serviceRequest' resource
    this.computePermissions('serviceRequest');

    // Use inherited initializeFilters method if available, otherwise initialize manually
    if (typeof (this as any).initializeFilters === 'function') {
      (this as any).initializeFilters(this.serviceCodeTableFilter, this.serviceCodeFiltersFormControlObject);
    } else {
      // Fallback: Initialize filter form controls manually
      for (const [key, value] of this.serviceCodeTableFilter) {
        this.serviceCodeFiltersFormControlObject[key] = new FormGroup({});
        for (const filterValue of value) {
          this.serviceCodeFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
        }
      }
    }

    // Connect table data source
    this.tableDataSource.connect = () => this.tableDataLevel2;

    // Load service codes from backend
    this.loadServiceCodes();
  }

  private loadServiceCodes(): void {
    // Using inherited http service
    this.http.get<any>(`${this.backendUrl}/CodeSystem?_count=500`).subscribe({
      next: (bundle) => {
        const entries = bundle?.entry || [];
        this.serviceCodesData = entries
          .map((e: any) => e.resource as CodeSystem)
          .filter(Boolean)
          .filter((cs: CodeSystem) => 
            cs.url?.includes('service') || 
            cs.title?.toLowerCase().includes('service') ||
            cs.purpose?.toLowerCase().includes('service')
          );

        this.tableDataLevel2.next(this.serviceCodesData);
      },
      error: (err) => {
        console.error('Failed to load service codes:', err);
        // Using inherited errorService
        this.errorService.openandCloseError('Failed to load service request codes');
      }
    });
  }

  onAddServiceCode(): void {
    // Using inherited router
    this.router.navigate(['/app/service-codes/add']);
  }

  onExportServiceCodes(): void {
    const snapshot = this.tableDataSource.data;
    if (!snapshot.length) {
      console.warn('No service codes to export.');
      return;
    }
    console.log('Export payload:', snapshot);
    // TODO: Implement actual export logic
  }

  showRow(codeSystem: CodeSystem): void {
    this.showServiceCodeDetails(codeSystem);
  }

  showServiceCodeDetails(codeSystem: CodeSystem): void {
    const excludeKeys = this.computeEmptyKeys(codeSystem);

    // Using inherited dialog service
    this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '650px',
      width: '100%',
      data: {
        resourceData: codeSystem,
        detailsBuilderObject: this.serviceCodeDetailsBuilder,
        excludeKeys
      }
    });
  }

  private computeEmptyKeys(codeSystem: any): string[] {
    if (!codeSystem) return [];
    return Object.keys(codeSystem).filter(key => this.isEmptyValue(codeSystem[key]));
  }

  private isEmptyValue(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0 || value.every(v => this.isEmptyValue(v));
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private computePermissions(resource: keyof typeof capacityObject): void {
    // Using inherited auth service
    this.canAddServiceCode$.next(this.auth.can(resource, 'add'));
    this.canExportServiceCode$.next(this.auth.can(resource, 'viewAll'));
  }

  get canAddServiceCode(): boolean {
    return this.canAddServiceCode$.getValue();
  }

  get canExportServiceCode(): boolean {
    return this.canExportServiceCode$.getValue();
  }

  override ngOnDestroy(): void {
    // Call parent cleanup if needed
    super.ngOnDestroy?.();
  }
}
