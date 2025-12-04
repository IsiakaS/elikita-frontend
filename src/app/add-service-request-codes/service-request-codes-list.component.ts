import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bundle, CodeSystem } from 'fhir/r4';
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
import { PatientAddressPipe } from '../shared/pipes/patient-address.pipe';
import { PatientAgePipe } from '../shared/pipes/patient-age.pipe';
import { PatientContactsPipe } from '../shared/pipes/patient-contacts.pipe';
import { PatientNamePipe } from '../shared/pipes/patient-name.pipe';
// import { PatientNamePipe } from '../shared/pipes/patient-name.pipe';

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
   providers: [PatientNamePipe, PatientContactsPipe, PatientAgePipe, PatientAddressPipe],
    
  templateUrl: './service-request-codes-list.component.html',
  styleUrls: ['../patient-observation/patient-observation.component.scss', './service-request-codes-list.component.scss']
})
export class ServiceRequestCodesListComponent extends AdmittedPatientsComponent implements OnInit, OnDestroy {
  // Table setup - using inherited tableDataSource and tableDataLevel2
  override displayedColumns: string[] = ['title', 'status', 'purpose', 'count', 'meta', 'actions'];

  // Filters
  serviceCodeTableFilter: Map<string, any[]> = new Map([
    ['status', ['draft', 'active', 'retired', 'unknown']]
  ]);



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
    this.organizingSearchFilters(this.serviceCodeTableFilter);
    // Compute permissions for 'codeSystem' resource
    // This sets the inherited canAdd$ and canExport$ from AdmittedPatientsComponent
    this.computePermissions('codeSystem');

    // Load service codes (CodeSystem and ValueSet resources)
    this.loadServiceCodes();
  }

  private loadServiceCodes(): void {
    const currentCodeSystems = this.stateService.orgWideResources.codeSystems?.getValue();
    const currentValueSets = this.stateService.orgWideResources.valueSets?.getValue();

    const hasCodeSystems = currentCodeSystems && currentCodeSystems.length > 0;
    const hasValueSets = currentValueSets && currentValueSets.length > 0;

    if (!hasCodeSystems && !hasValueSets) {
        
      // Fetch both CodeSystem and ValueSet from backend if not in orgWideResources
      console.log('Service codes not found in orgWideResources, fetching from backend...');

      forkJoin({
        codeSystems: this.http.get<Bundle>(`${this.backendUrl}/CodeSystem?_count=500`),
        valueSets: this.http.get<Bundle>(`${this.backendUrl}/ValueSet?_count=500`)
      }).subscribe({
        next: ({ codeSystems, valueSets }) => {
          console.log(`Fetched ${codeSystems.entry?.length || 0} CodeSystems and ${valueSets.entry?.length || 0} ValueSets`);

          // Process CodeSystems
          if (codeSystems.entry && codeSystems.entry.length > 0) {
            this.stateService.processOrgWideBundleTransaction(codeSystems);
          }

          // Process ValueSets
          if (valueSets.entry && valueSets.entry.length > 0) {
            this.stateService.processOrgWideBundleTransaction(valueSets);
          }

          // Subscribe to orgWideResources after loading
          this.initiateDataSourceSubscription(this.stateService.orgWideResources.codeSystems);
          this.applyServiceCodeFiltersAndTransforms();
        },
        error: (err) => {
          console.error('Failed to load service codes:', err);
          this.errorService.openandCloseError('Failed to load service codes: ' + err.message);
        }
      });
    } else {
      // Resources already in orgWideResources, use them directly
      console.log('Using existing service codes from orgWideResources');
      this.initiateDataSourceSubscription(this.stateService.orgWideResources.codeSystems);
      this.applyServiceCodeFiltersAndTransforms();
    }
  }

  private applyServiceCodeFiltersAndTransforms(): void {
    // STEP 2: Apply filters - filter for service-request related codes
    this.applyFilter('relevance', (row: any) => {
      const url = row.url?.toLowerCase() || '';
      const title = row.title?.toLowerCase() || '';
      const purpose = row.purpose?.toLowerCase() || '';

      return url.includes('service') || 
             title.includes('service') || 
             purpose.includes('service') ||
             url.includes('procedure') ||
             title.includes('procedure');
    });

    // STEP 3: Sort by meta.lastUpdated (descending - newest first)
    this.sortData(['meta.lastUpdated', 'date'], false);

    // STEP 5: Transform data to extract relevant information
    this.transformData((row: CodeSystem) => {
      return {
        ...row,
        conceptCount: row.count || row.concept?.length || 0,
        lastUpdated: row.meta?.lastUpdated || row.date
      };
    });

    // STEP 6: Organize search filters for UI
    this.organizingSearchFilters(new Map<string, any[]>(
      [
        ['status', ['draft', 'active', 'retired', 'unknown']]
      ]
    ));
  }

  onAddServiceCode(): void {
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


  override ngOnDestroy(): void {
    // Clear orgWideResources for CodeSystem and ValueSet
    console.log('Cleaning up service codes from orgWideResources');
    
    if (this.stateService.orgWideResources.codeSystems) {
      this.stateService.orgWideResources.codeSystems.next([]);
    }
    
    if (this.stateService.orgWideResources.valueSets) {
      this.stateService.orgWideResources.valueSets.next([]);
    }

    // Call parent cleanup if needed
    super.ngOnDestroy?.();
  }
}
