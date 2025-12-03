import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, startWith, Subscription } from 'rxjs';
import { Location } from 'fhir/r4';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service';
import { StateService } from '../shared/state.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ChipsDirective } from '../chips.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { NaPipe } from '../shared/na.pipe';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { MatDialog } from '@angular/material/dialog';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';

@Component({
  selector: 'app-admission-location',
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
  templateUrl: './admission-location.component.html',
  styleUrls: ['../patient-observation/patient-observation.component.scss', './admission-location.component.scss'],
})
export class AdmissionLocationComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly stateService = inject(StateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly subs = new Subscription();

  statusStyles = baseStatusStyles;

  // Table setup
  tableDataSource = new MatTableDataSource<Location>([]);
  tableDataLevel2 = new BehaviorSubject<Location[]>([]);
  displayedColumns: string[] = ['name', 'status', 'physicalType', 'meta', 'actions'];

  // Raw data
  locationsData: Location[] = [];

  // Filters
  locationTableFilter: Map<string, any[]> = new Map([
    ['status', ['active', 'suspended', 'inactive']],
    ['physicalType', ['ward', 'building', 'wing', 'room', 'bed', 'area', 'site']]
  ]);

  locationTableFilterArray = this.locationTableFilter;
  locationFiltersFormControlObject: any = {};

  // Category filter for quick access
  physicalTypeFilter = new FormControl('ward');

  // Details builder for dialog - simplified to essential fields only
  locationDetailsBuilder: DetailsBuilderObject = {
    resourceName: 'Location',
    resourceIcon: 'location_on',
    specialHeader: {
      strongSectionKey: 'name',
      iconSectionKeys: ['status', 'operationalStatus'],
      contentSectionKeys: ['physicalType', 'partOf']
    },
    groups: [
      {
        groupName: 'Basic Information',
        groupIcon: 'info',
        groupKeys: ['name', 'status', 'description']
      },
      {
        groupName: 'Classification',
        groupIcon: 'category',
        groupKeys: ['physicalType', 'type', 'partOf']
      },
      {
        groupName: 'Address',
        groupIcon: 'place',
        groupKeys: ['address']
      }
    ]
  };

  ngOnInit(): void {
    // Initialize filter form controls
    for (const [key, value] of this.locationTableFilter) {
      this.locationFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.locationFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    // Connect table data source
    this.tableDataSource.connect = () => this.tableDataLevel2;

    // Load locations from state
    this.subs.add(
      this.stateService.orgWideResources.locations.subscribe((entries: any[]) => {
        this.locationsData = (entries ?? [])
          .map(entry => entry.actualResource as Location)
          .filter(Boolean);

        // Don't filter initially, just set the data
        this.tableDataLevel2.next(this.locationsData);
      })
    );

    // Physical type filter subscription with startWith
    this.subs.add(
      this.physicalTypeFilter.valueChanges.pipe(startWith('ward')).subscribe(value => {
        this.applyPhysicalTypeFilter(value);
      })
    );
  }

  private applyPhysicalTypeFilter(value: string | null): void {
    if (!value || value === 'all') {
      this.tableDataLevel2.next(this.locationsData);
      return;
    }

    const filtered = this.locationsData.filter(loc => {
      const physicalType = loc.physicalType;
      if (!physicalType) return false;

      // Check text field
      const typeText = physicalType.text?.toLowerCase().trim();

      // Check coding array
      const codings = Array.isArray(physicalType.coding) ? physicalType.coding : [];
      const hasMatchingCode = codings.some((coding: any) => {
        const code = coding?.code?.toLowerCase().trim();
        const display = coding?.display?.toLowerCase().trim();
        const valueToMatch = value.toLowerCase().trim();

        return code === valueToMatch || display === valueToMatch;
      });

      // Match if text or any coding matches
      return typeText === value.toLowerCase().trim() || hasMatchingCode;
    });

    this.tableDataLevel2.next(filtered);
  }

  setPhysicalTypeFilter(value: string): void {
    this.physicalTypeFilter.setValue(value);
  }

  onExportLocations(): void {
    const snapshot = this.tableDataSource.data;
    if (!snapshot.length) {
      console.warn('No locations to export.');
      return;
    }
    console.log('Export payload:', snapshot);
    // TODO: Implement actual export logic
  }

  onAddAdmissionLocation(): void {
    this.router.navigate(['/app/admission-location/add']);
  }

  showRow(location: Location): void {
    this.showLocationDetails(location);
  }

  showLocationDetails(location: Location): void {
    // Compute keys to exclude (empty values)
    const excludeKeys = this.computeEmptyKeys(location);

    this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '650px',
      width: '100%',
      data: {
        resourceData: location,
        detailsBuilderObject: this.locationDetailsBuilder,
        excludeKeys
      }
    });
  }

  private computeEmptyKeys(location: any): string[] {
    if (!location) return [];

    return Object.keys(location).filter(key => {
      const value = location[key];
      return this.isEmptyValue(value);
    });
  }

  private isEmptyValue(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0 || value.every(v => this.isEmptyValue(v));
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // Permission helpers
  get canAddLocation(): boolean {
    return this.auth.can('location', 'add');
  }

  get canExportLocation(): boolean {
    return this.auth.can('location', 'viewAll');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
