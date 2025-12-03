import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, firstValueFrom, forkJoin, of } from 'rxjs';
import { Encounter, Patient, Bundle, Resource } from 'fhir/r4';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

import { StateService } from '../shared/state.service';
import { AuthService } from '../shared/auth/auth.service';
import { ErrorService } from '../shared/error.service';
import { InfoDialogService } from '../shared/info-dialog/info-dialog.service';
import { backendEndPointToken } from '../app.config';

import { ChipsDirective } from '../chips.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { DetailzViewzComponent, DetailActionButton } from '../detailz-viewz/detailz-viewz.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { PatientNamePipe } from "../shared/pipes/patient-name.pipe";
import { PatientContactsPipe } from "../shared/pipes/patient-contacts.pipe";
import { PatientAgePipe } from "../shared/pipes/patient-age.pipe";
import { PatientAddressPipe } from "../shared/pipes/patient-address.pipe";

interface AdmittedPatientRow {
    [key: string]: any;
}
@Component({
    selector: 'app-admitted-patients',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        ReactiveFormsModule,
        MatTableModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatChipsModule,
        MatInputModule,
        MatExpansionModule,
        MatCheckboxModule,
        DatePipe,
        TitleCasePipe,
        ChipsDirective,
        EmptyStateComponent,
        TableHeaderComponent,
        PatientNamePipe,
        PatientContactsPipe,
        PatientAgePipe,
        PatientAddressPipe
    ],
    providers: [PatientNamePipe, PatientContactsPipe, PatientAgePipe, PatientAddressPipe],
    templateUrl: './admitted-patients.component.html',
    styleUrls: ['../patients/patients.component.scss', './admitted-patients.component.scss']
})
export class AdmittedPatientsComponent implements OnInit, OnDestroy {
    stateService = inject(StateService);
    auth = inject(AuthService);
    router = inject(Router);
    dialog = inject(MatDialog);
    http = inject(HttpClient);
    errorService = inject(ErrorService);
    infoDialogService = inject(InfoDialogService);
    backendUrl = inject(backendEndPointToken);
    private readonly subs = new Subscription();

    //TABLE 
    tableDataSource = new MatTableDataSource<AdmittedPatientRow>([]);

    displayedColumns: string[] = ['name', 'location', 'admittedDate', 'phone', 'address', 'actions'];

    // Filtering metadata - stores active filter callbacks
    private activeFilters: Array<(row: AdmittedPatientRow) => boolean> = [];

    /**
     * Adds or replaces a filter callback for the data source.
     * Filters are applied before data is presented in the table.
     * 
     * @param filterKey - Unique identifier for this filter (e.g., 'ward', 'status', 'dateRange')
     * @param filterCallback - Function that returns true if row should be included
     * 
     * @example
     * // Filter by ward
     * this.applyFilter('ward', (row) => row.ward === 'ICU');
     * 
     * @example
     * // Filter by admission date range
     * this.applyFilter('dateRange', (row) => {
     *   const admittedDate = new Date(row.admittedDate || '');
     *   return admittedDate >= startDate && admittedDate <= endDate;
     * });
     */
    applyFilter(filterKey: string, filterCallback: (row: AdmittedPatientRow) => boolean): void {
        // Store filter with metadata
        const filterIndex = this.activeFilters.findIndex((f: any) => f.filterKey === filterKey);
        const wrappedCallback = Object.assign(filterCallback, { filterKey });

        if (filterIndex >= 0) {
            // Replace existing filter
            this.activeFilters[filterIndex] = wrappedCallback;
        } else {
            // Add new filter
            this.activeFilters.push(wrappedCallback);
        }

        // Apply all active filters to current data
        this.executeFilters();
    }

    /**
     * Removes a specific filter by its key.
     * 
     * @param filterKey - The key of the filter to remove
     */
    removeFilter(filterKey: string): void {
        this.activeFilters = this.activeFilters.filter((f: any) => f.filterKey !== filterKey);
        this.executeFilters();
    }

    /**
     * Clears all active filters and shows unfiltered data.
     */
    clearAllFilters(): void {
        this.activeFilters = [];
        this.executeFilters();
    }

    /**
     * Executes all active filter callbacks on the data source.
     * Filters are applied in the order they were added.
     */
    private executeFilters(): void {
        console.log('Executing filters:', this.activeFilters);
        if (this.activeFilters.length === 0) {

            // No filters - use predicate that passes all rows
            this.tableDataSource.filterPredicate = () => true;
        } else {
            console.log(false);
            // Combine all filter callbacks with AND logic
            this.tableDataSource.data = this.tableDataSource.data.filter((row: AdmittedPatientRow) => {
                // console.log
                return this.activeFilters.every(callback => { return callback(row); });
            });
        }

        // Trigger filter update (MatTableDataSource requires a filter value change)
        this.tableDataSource.filter = Date.now().toString();
    }

    /**
     * Combines referenced resources with current datasource elements.
     * Optimized to check StateService cache first before fetching from backend.
     * 
     * @param resourceConfigs - Array of resource configurations to fetch and attach
     * @param rowReferenceKey - Key in the AdmittedPatientRow that contains the reference (e.g., 'patient', 'encounter')
     * 
     * @example
     * // Attach Location resources referenced in encounter.location
     * this.combineReferencedResources(
     *   [{ resourceType: 'Location', attachKey: 'locationDetails' }],
     *   'encounter'
     * );
     * 
     * @example
     * // Attach multiple resource types
     * this.combineReferencedResources([
     *   { resourceType: 'Practitioner', attachKey: 'practitioner' },
     *   { resourceType: 'Location', attachKey: 'location' }
     * ], 'encounter');
     */
    combineReferencedResources(
        resourceConfigs: Array<{ resourceType: string; attachKey: string }>,
        rowReferenceKey: keyof AdmittedPatientRow
    ): void {
        const currentData = this.tableDataSource.data;
        if (!currentData.length) return;

        // Track pending operations to update table only once at the end
        let pendingOperations = resourceConfigs.length;
        let hasUpdates = false;

        // Process each resource type
        resourceConfigs.forEach(config => {
            this.attachResourceToRows(currentData, config, rowReferenceKey, () => {
                pendingOperations--;
                hasUpdates = true;

                // Update table only once when all operations complete
                if (pendingOperations === 0 && hasUpdates) {
                    // Trigger change detection by creating new array reference with mutated data
                    this.tableDataSource.data = [...currentData];
                }
            });
        });
    }

    /**
     * Attaches a specific resource type to all rows.
     * Optimized to use cached data from StateService before fetching from backend.
     */
    private attachResourceToRows(
        rows: AdmittedPatientRow[],
        config: { resourceType: string; attachKey: string },
        rowReferenceKey: keyof AdmittedPatientRow,
        onComplete: () => void
    ): void {
        const { resourceType, attachKey } = config;
        // alert(resourceType);
        // Extract all unique reference IDs from rows
        const referenceIds = new Set<string>();
        rows.forEach(row => {
            const referencedObject = row[rowReferenceKey] as any;
            // alert(JSON.stringify(referencedObject));
            if (referencedObject) {
                // Extract references based on resource type
                const refs = this.extractReferences(referencedObject, resourceType);
                console.log(`Extracted references for ${resourceType}:`, refs);
                refs.forEach(ref => referenceIds.add(ref));
            }
        });

        // alert(JSON.stringify(Array.from(referenceIds)));

        if (referenceIds.size === 0) {
            onComplete();
            return;
        }

        // Try to find resources in StateService cache first
        const cachedResources = this.findInStateService(resourceType);
        const foundResourcesMap = new Map<string, any>();
        const missingIds: string[] = [];

        referenceIds.forEach(refId => {
            const cached = cachedResources.find(r => {
                const id = r.actualResource?.id || r.referenceId?.split('/').pop();
                return `${resourceType}/${id}` === refId || id === refId.split('/').pop();
            });

            if (cached) {
                foundResourcesMap.set(refId, cached.actualResource);
            } else {
                missingIds.push(refId);
            }
        });

        // Fetch missing resources from backend if needed
        if (missingIds.length > 0) {
            this.fetchMissingResources(missingIds, resourceType).subscribe({
                next: (fetchedResources) => {
                    // Merge fetched resources with cached ones
                    fetchedResources.forEach(resource => {
                        const refId = `${resourceType}/${resource.id}`;
                        foundResourcesMap.set(refId, resource);
                    });

                    // Attach all resources to rows (without triggering table update)
                    console.log('Attaching resources:', resourceType, foundResourcesMap);
                    this.performResourceAttachment(rows, foundResourcesMap, rowReferenceKey, attachKey, resourceType);
                    onComplete();
                },
                error: (err) => {
                    console.error(`Failed to fetch ${resourceType} resources:`, err);
                    // Still attach cached resources even if fetch fails
                    this.performResourceAttachment(rows, foundResourcesMap, rowReferenceKey, attachKey, resourceType);
                    onComplete();
                }
            });
        } else {
            // All resources found in cache
            console.log('Attaching resources:', resourceType, foundResourcesMap);

            this.performResourceAttachment(rows, foundResourcesMap, rowReferenceKey, attachKey, resourceType);
            onComplete();
        }
    }

    /**
     * Extracts reference IDs from a FHIR resource for a specific resource type.
     */
    private extractReferences(ref: { reference: string, [key: string]: any }, resourceType: string): string[] {
        const references: string[] = [];

        // Common reference paths in FHIR resources
        // const checkReference = (ref: any) => {
        if (ref?.reference && typeof ref.reference === 'string') {
            if (ref.reference.startsWith(resourceType + '/') ||
                ref.reference.split('/').pop()) {
                // alert(ref.reference);
                references.push(ref.reference);
            }
        }
        // };

        // Check common FHIR reference fields
        // if (resource.location) {
        //     if (Array.isArray(resource.location)) {
        //         resource.location.forEach((loc: any) => {
        //             checkReference(loc.location);
        //             checkReference(loc);
        //         });
        //     } else {
        //         checkReference(resource.location);
        //     }
        // }

        // if (resource.participant && Array.isArray(resource.participant)) {
        //     resource.participant.forEach((p: any) => checkReference(p.individual));
        // }

        // if (resource.serviceProvider) {
        //     checkReference(resource.serviceProvider);
        // }

        // if (resource.subject) {
        //     checkReference(resource.subject);
        // }

        // Generic field scanning for Reference types


        return references;
    }

    /**
     * Finds resources in StateService cache by type.
     */
    private findInStateService(resourceType: string): any[] {
        const stateMap: { [key: string]: any } = {
            'Patient': this.stateService.orgWideResources.patient,
            'Location': this.stateService.orgWideResources.locations,
            'Specimen': this.stateService.orgWideResources.specimens,
            'Medication': this.stateService.orgWideResources.medications,
            'MedicationRequest': this.stateService.orgWideResources.medicationRequests,
            'MedicationDispense': this.stateService.orgWideResources.medicationDispenses,
            'ServiceRequest': this.stateService.orgWideResources.serviceRequests,
            'Practitioner': this.stateService.orgWideResources.patient // Fallback if no practitioner list
        };

        const observable = stateMap[resourceType];
        if (!observable) return [];

        let cachedData: any[] = [];
        observable.pipe(map((data: any) => data)).subscribe((data: any) => cachedData = data);
        return cachedData;
    }

    /**
     * Fetches missing resources from backend.
     */
    private fetchMissingResources(ids: string[], resourceType: string): Observable<any[]> {
        if (ids.length === 0) return of([]);

        // Build FHIR search query with _id parameter
        const idParams = ids.map(id => id.split('/').pop()).join(',');
        const url = `${this.backendUrl}/${resourceType}?_id=${idParams}`;

        return this.http.get<Bundle>(url).pipe(
            map(bundle => {
                return bundle.entry?.map(e => e.resource).filter(Boolean) || [];
            }),
            catchError(err => {
                console.error(`Error fetching ${resourceType}:`, err);
                return of([]);
            })
        );
    }

    /**
     * Performs the actual resource attachment to rows without triggering table updates.
     * Table update is handled by the caller to batch multiple operations.
     */
    private performResourceAttachment(
        rows: AdmittedPatientRow[],
        resourceMap: Map<string, any>,
        rowReferenceKey: keyof AdmittedPatientRow,
        attachKey: string,
        resourceType: string
    ): void {
        rows.forEach(row => {
            const referencedObject = row[rowReferenceKey] as any;
            if (!referencedObject) return;

            const refs = this.extractReferences(referencedObject, resourceType);
            const attachedResources: any[] = [];

            refs.forEach(ref => {
                const resource = resourceMap.get(ref);
                if (resource) {
                    attachedResources.push(resource);
                }
            });

            // Attach as single resource or array depending on count
            if (attachedResources.length === 1) {
                (row as any)[attachKey] = attachedResources[0];
            } else if (attachedResources.length > 1) {
                (row as any)[attachKey] = attachedResources;
            }
        });

        // Note: Table update is now handled by combineReferencedResources
        // to batch multiple resource type updates into a single render
    }

    /**
     * Fetches resources that reference the current rows and attaches them to matching rows.
     * This is a reverse lookup: fetch a bundle of resources, check which rows they reference, and attach them.
     * 
     * @param bundleConfigs - Array of configurations for fetching resource bundles
     * @param rowIdKey - Key in AdmittedPatientRow to match against (e.g., 'patient', 'encounter')
     * 
     * @example
     * // Fetch all Observations and attach them to rows based on subject reference
     * this.fetchReferencingResources([
     *   { 
     *     resourceType: 'Observation', 
     *     referenceField: 'subject', 
     *     attachKey: 'observations' 
     *   }
     * ], 'patient');
     * // Process: Fetch Observation bundle → Check each obs.subject → Match to patient.id → Attach to that row
     * 
     * @example
     * // Fetch multiple resource types
     * this.fetchReferencingResources([
     *   { resourceType: 'MedicationRequest', referenceField: 'encounter', attachKey: 'medications' },
     *   { resourceType: 'Procedure', referenceField: 'encounter', attachKey: 'procedures' }
     * ], 'encounter');
     */
    fetchReferencingResources(
        bundleConfigs: Array<{
            resourceType: string;
            referenceField: string;
            attachKey: string
        }>,
        // rowIdKey: keyof AdmittedPatientRow
    ): void {
        const currentData = this.tableDataSource.data;
        if (!currentData.length) return;

        // Track pending operations
        let pendingOperations = bundleConfigs.length;
        let hasUpdates = false;

        // Process each bundle configuration
        bundleConfigs.forEach(config => {
            this.fetchAndDistributeBundle(currentData, config, () => {
                pendingOperations--;
                hasUpdates = true;

                // Update table once when all operations complete
                if (pendingOperations === 0 && hasUpdates) {
                    this.tableDataSource.data = [...this.tableDataSource.data];
                }
            });
        });
    }

    /**
     * Fetches a bundle of resources and distributes them to matching rows.
     */
    private fetchAndDistributeBundle(
        rows: AdmittedPatientRow[],
        config: { resourceType: string; referenceField: string; attachKey: string },
        // rowIdKey: keyof AdmittedPatientRow,
        onComplete: () => void
    ): void {
        const { resourceType, referenceField, attachKey } = config;

        // First try StateService cache
        const cachedResources = this.findInStateService(resourceType);
        if (cachedResources.length > 0) {
            const resources = cachedResources.map(r => r.actualResource).filter(Boolean);
            this.distributeResourcesToRows(rows, resources, referenceField, attachKey);
            onComplete();
            return;
        }

        // Fetch from backend - get all resources of this type
        const fetchUrl = `${this.backendUrl}/${resourceType}`;

        this.http.get<Bundle>(fetchUrl).pipe(
            map(bundle => bundle.entry?.map(e => e.resource).filter(Boolean) || []),
            catchError(err => {
                console.error(`Error fetching ${resourceType} bundle:`, err);
                return of([]);
            })
        ).subscribe({
            next: (fetchedResources) => {
                this.distributeResourcesToRows(rows, fetchedResources, referenceField, attachKey);
                onComplete();
            },
            error: () => {
                onComplete();
            }
        });
    }

    /**
     * Distributes resources from a bundle to matching rows based on reference field.
     * 
     * For each resource in the bundle:
     * 1. Extract the reference ID from the specified field
     * 2. Find which row has that ID (by matching row.id directly)
     * 3. Attach the resource to that row
     */
    private distributeResourcesToRows(
        rows: AdmittedPatientRow[],
        resources: any[],
        referenceField: string,
        attachKey: string,
        // rowIdKey: keyof AdmittedPatientRow
    ): void {
        // Build a map of row ID to row for fast lookup
        const rowMap = new Map<string, AdmittedPatientRow>();
        rows.forEach(row => {
            const rowId = (row as any).id;
            if (rowId) {
                // Store with just the ID and also with resource type prefix for flexible matching
                rowMap.set(rowId, row);
                // Also store with potential resource type prefix (e.g., "Patient/123")
                rowMap.set(`Patient/${rowId}`, row);
                rowMap.set(`Encounter/${rowId}`, row);
            }
        });

        // Create a map to collect resources for each row
        const rowResourcesMap = new Map<AdmittedPatientRow, any[]>();

        // Process each resource in the bundle
        resources.forEach(resource => {
            if (!resource) return;

            // Extract the reference ID from the specified field
            const referenceId = this.extractReferenceId(resource, referenceField);
            if (!referenceId) return;

            // Extract just the ID part (e.g., "Patient/123" → "123")
            const idOnly = referenceId.includes('/') ? referenceId.split('/').pop() : referenceId;

            // Find the matching row (try both full reference and ID only)
            let matchingRow = rowMap.get(referenceId) || rowMap.get(idOnly || '');

            if (matchingRow) {
                // Collect resources for this row
                if (!rowResourcesMap.has(matchingRow)) {
                    rowResourcesMap.set(matchingRow, []);
                }
                rowResourcesMap.get(matchingRow)!.push(resource);
            }
        });

        // Attach collected resources to rows
        rowResourcesMap.forEach((collectedResources, row) => {
            if (collectedResources.length === 1) {
                (row as any)[attachKey] = collectedResources[0];
            } else if (collectedResources.length > 1) {
                (row as any)[attachKey] = collectedResources;
            }
        });
    }

    /**
     * Extracts reference ID from a resource field.
     * Handles various FHIR reference formats.
     */
    private extractReferenceId(resource: any, fieldPath: string): string | null {
        // Navigate to the field (supports dot notation like "subject.reference")
        const fieldParts = fieldPath.split('.');
        let value: any = resource;

        for (const part of fieldParts) {
            if (!value) return null;
            value = value[part];
        }

        if (!value) return null;

        // Handle different reference formats
        if (typeof value === 'string') {
            // Direct string reference (e.g., "Patient/123")
            return value;
        }

        if (value.reference && typeof value.reference === 'string') {
            // FHIR Reference object (e.g., { reference: "Patient/123" })
            return value.reference;
        }

        // Handle array of references (take first one)
        if (Array.isArray(value) && value.length > 0) {
            const firstRef = value[0];
            if (typeof firstRef === 'string') {
                return firstRef;
            }
            if (firstRef?.reference) {
                return firstRef.reference;
            }
        }

        return null;
    }

    /**
     * Filters resources to find those that reference a specific resource ID.
     */
    private filterResourcesByReference(
        resources: any[],
        referenceField: string,
        targetReferenceId: string
    ): any[] {
        return resources.filter(resource => {
            if (!resource) return false;

            // Get the reference field value
            const fieldValue = resource[referenceField];
            if (!fieldValue) return false;

            // Handle different reference formats
            if (typeof fieldValue === 'string') {
                return fieldValue === targetReferenceId;
            }

            // Handle FHIR Reference object
            if (fieldValue.reference) {
                return fieldValue.reference === targetReferenceId;
            }

            // Handle array of references
            if (Array.isArray(fieldValue)) {
                return fieldValue.some(ref => {
                    if (typeof ref === 'string') {
                        return ref === targetReferenceId;
                    }
                    if (ref?.reference) {
                        return ref.reference === targetReferenceId;
                    }
                    return false;
                });
            }

            return false;
        });
    }

    /**
     * Attaches referencing resources to a row.
     */
    private attachReferencingResources(
        row: AdmittedPatientRow,
        resources: any[],
        attachKey: string
    ): void {
        // Attach as single resource or array depending on count
        if (resources.length === 1) {
            (row as any)[attachKey] = resources[0];
        } else if (resources.length > 1) {
            (row as any)[attachKey] = resources;
        }
    }

    /**
     * Determines the resource type from a FHIR resource object.
     */
    private getResourceType(resource: any): string {
        return resource.resourceType || 'Unknown';
    }

    /**
     * Sorts the table data by multiple keys in sequence.
     * Sorts are applied in the order specified in the keys array.
     * 
     * @param sortKeys - Array of keys to sort by. If empty, uses default sort key.
     * @param ascending - Whether to sort in ascending order (default: true)
     * 
     * @example
     * // Sort by ward, then by admittedDate
     * this.sortData(['ward', 'admittedDate']);
     * 
     * @example
     * // Sort by multiple keys in descending order
     * this.sortData(['admittedDate', 'patientName'], false);
     * 
     * @example
     * // Use default sort (admittedDate)
     * this.sortData();
     */
    sortData(sortKeys: string[] = ['admittedDate'], ascending: boolean = true): void {
        const currentData = this.tableDataSource.data;
        if (!currentData.length) return;

        const sortedData = [...currentData].sort((a, b) => {
            // Apply each sort key in sequence
            for (const key of sortKeys) {
                const comparison = this.compareValues(a, b, key, ascending);
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        });

        this.tableDataSource.data = sortedData;
    }

    /**
     * Compares two values for a given key.
     * Supports nested keys using dot notation (e.g., 'patient.name').
     * Assumes all values are ISO date strings.
     */
    private compareValues(
        a: AdmittedPatientRow,
        b: AdmittedPatientRow,
        key: string,
        ascending: boolean
    ): number {
        const valueA = this.getNestedValue(a, key);
        const valueB = this.getNestedValue(b, key);

        // Handle null/undefined values - push to end
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;

        // Parse ISO date strings and compare timestamps
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);

        // Compare timestamps
        const comparison = dateA.getTime() - dateB.getTime();

        return ascending ? comparison : -comparison;
    }

    /**
     * Gets a nested value from an object using dot notation.
     * Supports paths like 'patient.name.0.given'
     */
    private getNestedValue(obj: any, path: string): any {
        const keys = path.split('.');
        let value = obj;

        for (const key of keys) {
            if (value == null) return null;
            value = value[key];
        }

        return value;
    }

    /**
     * Transforms table data by applying a callback function to each row.
     * The callback receives the row and should return the transformed row.
     * Updates the table data source with the transformed data.
     * 
     * @param transformCallback - Function that receives a row and returns the transformed row
     * 
     * @example
     * // Add a computed property to each row
     * this.transformData((row) => {
     *   return {
     *     ...row,
     *     fullName: `${row.firstName} ${row.lastName}`,
     *     daysAdmitted: this.calculateDays(row.admittedDate)
     *   };
     * });
     * 
     * @example
     * // Normalize date formats
     * this.transformData((row) => {
     *   return {
     *     ...row,
     *     admittedDate: new Date(row.admittedDate).toISOString()
     *   };
     * });
     */
    transformData(transformCallback: (row: any) => any): void {
        const currentData = [...this.tableDataSource.data];
        const transformedData = currentData.map(row => transformCallback(row));
        this.tableDataSource.data = transformedData;
    }

    inititateDataSourceSubscription(dataSource: Observable<any>, actualResource: any = null) {
        this.subs.add(
            dataSource.subscribe({
                next: (data) => {
                    data = data.map((entry: any) => {
                        // console.log(entry);
                        return entry.actualResource
                    });


                    this.tableDataSource.data = data;

                },
                error: (err) => {
                    this.errorService.openandCloseError('Failed to load admitted patients data.' + err);
                }
            })
        );
    }

    tableHeaderMappedFilterArray?: Map<string, any[]>;
    tableHeaderFiltersFormControlObject: { [key: string]: FormGroup } = {};
    organizingSearchFilters(filtersConfig: Map<string, any[]>) {
        this.tableHeaderMappedFilterArray = filtersConfig;

        for (const [key, value] of filtersConfig) {
            this.tableHeaderFiltersFormControlObject[key] = new FormGroup({});
            for (const filterValue of value) {
                this.tableHeaderFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
            }
        }



    }

    ngOnInit(): void {
        console.log(this.stateService.orgWideResources.encounters.getValue());
        // TODO: Implement
        this.inititateDataSourceSubscription(this.stateService.orgWideResources.encounters);
        //apply filter
        this.applyFilter('status', (row) => {

            console.log(row); return row['status'] === 'in-progress';
        });
        //hospitalization status
        this.applyFilter('hospitalization', (row) => {
            // console.log(row['hospitalization']);
            return row['hospitalization'] !== undefined &&
                row['hospitalization'].preAdmissionIdentifier?.value
        });
        //in -patient class
        this.applyFilter('class', (row) => row['class'] && row['class'].code === 'IMP');
        console.log(this.tableDataSource.data);

        //sort by admitted date

        this.sortData(['hospitalization.preAdmissionIdentifier.period.start'], false);

        //combine patient data
        this.combineReferencedResources(
            [
                { resourceType: 'Patient', attachKey: 'patientDetails' }
            ],
            'subject'
        );

        // Transform data to extract ward, room, bed, and admitted date
        this.transformData((row) => {
            // Extract admitted date from hospitalization.preAdmissionIdentifier.period.start
            const admittedDate = row.hospitalization?.preAdmissionIdentifier?.period?.start;

            // Extract location information from location array (last entry)
            let latestWard = null;
            let latestRoom = null;
            let latestBed = null;

            if (row.location && Array.isArray(row.location) && row.location.length > 0) {
                // Get the last location entry (most recent)
                const lastLocation = row.location[row.location.length - 1];

                // The location reference points to a Location resource
                // We need to check if we have the location details
                if (lastLocation.location) {
                    const locationRef = lastLocation.location.reference;
                    // alert(JSON.stringify(lastLocation.location));
                    // Try to find the location in physicalType or display
                    const locationDisplay = lastLocation.location.display || '';

                    //extract date
                    const admittedDate = lastLocation.period?.start;

                    //get location with the same admitted date
                    // Find location entry with the same admitted date
                    let matchedLocation = null;
                    console.log(admittedDate)
                    if (admittedDate) {
                        matchedLocation = row.location.filter((loc: any) => loc.period?.start === admittedDate);
                        console.log(matchedLocation);
                    }

                    if (matchedLocation && matchedLocation.length > 0) {
                        // Prefer extracting ward/room/bed from matchedLocation if available

                        const { bed, ward, room } = seperateWRAndBed(matchedLocation)
                        latestWard = ward.length > 0 ? ward[ward.length - 1] : null;
                        latestRoom = room.length > 0 ? room[room.length - 1] : null;
                        latestBed = bed.length > 0 ? bed[bed.length - 1] : null;
                    } else {

                        //just find the last ward/room/bed from row.location array
                        const { bed, ward, room } = seperateWRAndBed(row.location);
                        latestWard = ward.length > 0 ? ward[ward.length - 1] : null;
                        latestRoom = room.length > 0 ? room[room.length - 1] : null;
                        latestBed = bed.length > 0 ? bed[bed.length - 1] : null;


                    }
                    console.log(latestWard, latestRoom, latestBed);
                }


                function seperateWRAndBed(matchedLocation: Array<Location>) {
                    const bedRoomWardObject: any = {
                        ward: [],
                        room: [],
                        bed: []
                    };
                    matchedLocation.forEach((loc: any) => {
                        if (loc.physicalType?.coding?.[0]) {
                            const code = loc.physicalType.coding[0].code;
                            const display = loc.physicalType.coding[0].display || loc.location?.display;

                            if (code === 'wa' || display?.toLowerCase().includes('ward')) {
                                bedRoomWardObject.ward.push(display);
                            }
                            if (code === 'ro' || display?.toLowerCase().includes('room')) {
                                bedRoomWardObject.room.push(display);
                            }
                            if (code === 'bd' || display?.toLowerCase().includes('bed')) {
                                bedRoomWardObject.bed.push(display);
                            }
                        } else {
                            console.log(loc)
                            //extract from display directly
                            const parts = loc.location?.display//.split('-').map((p: string) => p.trim());
                            // parts.forEach((part: string) => {
                            if (parts.toLowerCase().includes('room')) {
                                bedRoomWardObject.room.push(parts);
                            } else if (parts.toLowerCase().includes('bed')) {
                                bedRoomWardObject.bed.push(parts);
                            } else {
                                bedRoomWardObject.ward.push(parts);
                            }
                            // });
                        }


                    });
                    return bedRoomWardObject;
                }




            }




            return {
                ...row,
                admittedDate,
                currentWard: latestWard,
                currentRoom: latestRoom,
                currentBed: latestBed
            };
        });

        console.log(this.tableDataSource.data);
        this.organizingSearchFilters(new Map<string, any[]>([
            ['ward', ['ICU', 'General', 'Pediatrics', 'Maternity']],
            // ['status', ['in-progress', 'completed', 'on-hold']],
        ]));

    }

    /**
     * Builds the DetailsBuilderObject for admission details.
     * Focuses on patient information and admission/hospitalization details.
     */
    private buildAdmissionDetailsBuilder(): DetailsBuilderObject {
        return {
            resourceName: 'Admitted Patient',
            resourceIcon: 'hotel',
            specialHeader: {
                strongSectionKey: 'patient name',
                iconSectionKeys: ['status', 'class'],
                contentSectionKeys: ['Admitted Date']
            },
            groups: [
                {
                    groupName: 'Patient Information',
                    groupIcon: 'person',
                    groupKeys: [
                        'patient name',
                        'patient gender',
                        'patient birthDate',
                        'patient telecom',
                        'patient address'
                    ]
                },
                {
                    groupName: 'Admission Details',
                    groupIcon: 'local_hospital',
                    groupKeys: [

                        'Admitted Date',
                        'Admission Source',
                        'status',
                        'class'
                    ]
                },
                {
                    groupName: 'Location Details',
                    groupIcon: 'location_on',
                    groupKeys: [
                        'Ward',
                        'Room',
                        'Bed',
                        // 'location'
                    ]
                },
                {
                    groupName: 'Clinical Information',
                    groupIcon: 'medical_services',
                    groupKeys: [
                        'reasonCode',
                        'period',

                    ]
                }
            ],
            // otherKeys: [
            //     //other keys tat are just added and not in the encounter resource
            //     'patientDetails.name',
            //     'patientDetails.gender',
            //     'patientDetails.birthDate',
            //     'patientDetails.telecom',
            //     'patientDetails.address',
            //     'hospitalization.admitSource'

            // ]
        };
    }

    /**
     * Builds action buttons for admitted patient actions.
     */
    patientNamePipe = inject(PatientNamePipe);
    patientAddressPipe = inject(PatientAddressPipe);
    patientContactPipe = inject(PatientContactsPipe);
    private buildAdmissionActionButtons(): DetailActionButton[] {
        return [
            {
                key: 'viewEncounter',
                label: 'View Full Encounter',
                icon: 'description',
                color: 'primary',
                capabilities: [{ resource: 'encounter', action: 'view' }]
            },
            {
                key: 'updateLocation',
                label: 'Update Location',
                icon: 'edit_location',
                color: 'primary',
                capabilities: [{ resource: 'location', action: 'update' }]
            },
            {
                key: 'addObservation',
                label: 'Add Observation',
                icon: 'monitor_heart',
                color: 'accent',
                capabilities: [{ resource: 'observation', action: 'add' }]
            },
            {
                key: 'requestLabTest',
                label: 'Request Lab Test',
                icon: 'biotech',
                color: 'accent',
                capabilities: [{ resource: 'labRequest', action: 'request' }]
            },
            {
                key: 'discharge',
                label: 'Discharge Patient',
                icon: 'logout',
                color: 'warn',
                capabilities: [{ resource: 'encounter', action: 'update' }]
            }
        ];
    }

    // <td (click)=navigateToTasks(me) #me class="action-column"></td>
    async navigateToTasks(clickedElement: EventTarget | null, row: AdmittedPatientRow) {
        if (!clickedElement) return;

        // Find the closest <td> element from the clicked target
        let targetElement = clickedElement as HTMLElement;

        // Traverse up the DOM tree to find the <td> element
        while (targetElement && targetElement.tagName !== 'TD') {
            targetElement = targetElement.parentElement as HTMLElement;
            if (!targetElement) return;
        }

        // Check if the <td> element has the 'action-column' class
        if (targetElement.classList.contains('action-column')) {
            // Show admission details dialog
            this.showAdmissionDetails(row);
        } else {
            // Navigate to patient tasks/details
            const patientId = await firstValueFrom(this.stateService.currentPatientId$);
            this.router.navigate(['/admitted-patients', patientId]);
        }
    }

    /**
     * Shows the admission details dialog when a row is clicked.
     */


    showAdmissionDetails(row: AdmittedPatientRow): void {
        const dialogRef = this.dialog.open(DetailzViewzComponent, {
            maxHeight: '93vh',
            maxWidth: '90vh',
            data: {
                resourceData: {
                    ...row,
                    ['patient name']: this.patientNamePipe.transform(row['patientDetails']?.name),
                    ['patient gender']: row['patientDetails']?.gender,
                    ['patient birthDate']: row['patientDetails']?.birthDate,
                    ['patient phone']: this.patientContactPipe.transform(row['patientDetails']?.telecom, "phone", 2),
                    ['patient email']: this.patientContactPipe.transform(row['patientDetails']?.telecom, "email", 2),
                    ['patient address']: this.patientAddressPipe.transform(row['patientDetails']?.address),
                    ['Ward']: row['currentWard'],
                    ['Room']: row['currentRoom'],
                    ['Bed']: row['currentBed'],
                    ['Admitted Date']: row['admittedDate'],
                    ['Admission Source']: row['hospitalization']?.admitSource?.coding?.[0]?.display || row['hospitalization']?.admitSource.text,
                    //  'patient name',
                    //     'patient gender',
                    //     'patient birthDate',
                    //     'patient telecom',
                    //     'patient address'
                    // hospitalization.admitSource
                },
                detailsBuilderObject: this.buildAdmissionDetailsBuilder(),
                actionButtons: this.buildAdmissionActionButtons()
            }
        });

        const sub = dialogRef.componentInstance?.actionInvoked.subscribe(({ key }) => {
            this.handleAdmissionAction(key, row);
        });

        dialogRef.afterClosed().subscribe(() => sub?.unsubscribe());
    }

    /**
     * Handles action button clicks from the admission details dialog.
     */
    private handleAdmissionAction(actionKey: string, row: AdmittedPatientRow): void {
        console.log('Action invoked:', actionKey, 'for row:', row);

        switch (actionKey) {
            case 'viewEncounter':
                console.log('View full encounter details');
                console.log('Encounter ID:', row['id']);
                console.log('Full encounter data:', row);
                // TODO: Navigate to full encounter view or open encounter details dialog
                break;

            case 'updateLocation':
                console.log('Update patient location');
                console.log('Current location:', {
                    ward: row['latestWard'],
                    room: row['latestRoom'],
                    bed: row['latestBed']
                });
                console.log('All locations:', row['location']);
                // TODO: Open location update dialog
                break;

            case 'addObservation':
                console.log('Add observation for patient');
                console.log('Patient ID:', row['patientDetails']?.id);
                console.log('Encounter ID:', row['id']);
                // TODO: Open add observation dialog
                break;

            case 'requestLabTest':
                console.log('Request lab test for patient');
                console.log('Patient ID:', row['patientDetails']?.id);
                console.log('Encounter ID:', row['id']);
                // TODO: Open lab test request dialog
                break;

            case 'discharge':
                console.log('Discharge patient');
                console.log('Admission Number:', row['hospitalization']?.preAdmissionIdentifier?.value);
                console.log('Patient:', row['patientDetails']?.name);
                console.log('Admitted since:', row['admittedDate']);
                // TODO: Open discharge confirmation dialog and update encounter status
                break;

            default:
                console.log('Unknown action:', actionKey);
                break;
        }
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }
}
