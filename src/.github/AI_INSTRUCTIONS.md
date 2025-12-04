# AI Instructions for elikita-frontend Development

## Table of Contents
1. [Component Architecture Patterns](#component-architecture-patterns)
2. [Building Resource List Components](#building-resource-list-components)
3. [Permission Management](#permission-management)
4. [State Management](#state-management)
5. [Code Style Guidelines](#code-style-guidelines)

---

## Component Architecture Patterns

### Base Class Inheritance Pattern

For components that primarily display lists of FHIR resources, **ALWAYS extend `AdmittedPatientsComponent`** instead of re-declaring services and properties.

#### ✅ DO: Extend Base Component

```typescript
export class ServiceRequestCodesListComponent extends AdmittedPatientsComponent implements OnInit, OnDestroy {
  // Only declare NEW properties specific to this component
  override displayedColumns: string[] = ['title', 'status', 'purpose', 'count', 'meta', 'actions'];
  
  // Details builder specific to this resource
  serviceCodeDetailsBuilder: DetailsBuilderObject = {
    resourceName: 'Service Code',
    resourceIcon: 'science',
    // ...configuration
  };
}
```

#### ❌ DON'T: Re-declare Inherited Services

```typescript
// ❌ WRONG - These are already in AdmittedPatientsComponent
export class MyListComponent {
  private http = inject(HttpClient);           // Already inherited
  private router = inject(Router);             // Already inherited
  private dialog = inject(MatDialog);          // Already inherited
  private stateService = inject(StateService); // Already inherited
  private errorService = inject(ErrorService); // Already inherited
  private auth = inject(AuthService);          // Already inherited
  private backendUrl = inject(backendEndPointToken); // Already inherited
}
```

---

## Building Resource List Components

### Step-by-Step Guide

#### 1. Component Class Setup

```typescript
import { AdmittedPatientsComponent } from '../admitted-patients/admitted-patients.component';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    // ... other Material modules
    TableHeaderComponent,
    EmptyStateComponent
  ],
  providers: [PatientNamePipe, PatientContactsPipe, PatientAgePipe, PatientAddressPipe],
  templateUrl: './resource-list.component.html',
  styleUrls: ['../patient-observation/patient-observation.component.scss', './resource-list.component.scss']
})
export class ResourceListComponent extends AdmittedPatientsComponent implements OnInit, OnDestroy {
  // ONLY declare properties specific to YOUR resource
  override displayedColumns: string[] = ['field1', 'field2', 'actions'];
  
  // Resource-specific filters
  resourceTableFilter: Map<string, any[]> = new Map([
    ['status', ['active', 'inactive']],
    ['type', ['typeA', 'typeB']]
  ]);
  
  resourceTableFilterArray = this.resourceTableFilter;
  resourceFiltersFormControlObject: any = {};
  
  // Details builder for dialog
  resourceDetailsBuilder: DetailsBuilderObject = {
    resourceName: 'Resource Name',
    resourceIcon: 'icon_name',
    specialHeader: {
      strongSectionKey: 'primaryField',
      iconSectionKeys: ['status'],
      contentSectionKeys: ['date', 'reference']
    },
    groups: [
      {
        groupName: 'Basic Info',
        groupIcon: 'info',
        groupKeys: ['field1', 'field2']
      }
    ]
  };
}
```

#### 2. Implement ngOnInit Pattern

```typescript
override ngOnInit(): void {
  // STEP 1: Compute permissions for the resource
  this.computePermissions('resourceType'); // e.g., 'codeSystem', 'specimen', 'location'
  
  // STEP 2: Determine context (patient-specific vs org-wide)
  const patientId = this.stateService.currentPatientId$.getValue();
  
  if (patientId) {
    // Patient-specific mode
    this.loadPatientSpecificResources();
  } else {
    // Organization-wide mode
    this.loadOrgWideResources();
  }
}
```

#### 3. Load Resources Pattern

```typescript
private loadOrgWideResources(): void {
  const currentResources = this.stateService.orgWideResources.resourceType.getValue();
  
  if (!currentResources || currentResources.length === 0) {
    // Fetch from backend
    console.log('Resources not found in orgWideResources, fetching from backend...');
    
    this.http.get<Bundle>(`${this.backendUrl}/ResourceType?_count=500`).subscribe({
      next: (bundle) => {
        console.log(`Fetched ${bundle.entry?.length || 0} resources`);
        
        // Persist to state
        this.stateService.processOrgWideBundleTransaction(bundle);
        
        // Subscribe to data source
        this.initiateDataSourceSubscription(this.stateService.orgWideResources.resourceType);
        this.applyResourceFiltersAndTransforms();
      },
      error: (err) => {
        console.error('Failed to load resources:', err);
        this.errorService.openandCloseError('Failed to load resources');
      }
    });
  } else {
    // Use existing data
    console.log('Using existing resources from orgWideResources');
    this.initiateDataSourceSubscription(this.stateService.orgWideResources.resourceType);
    this.applyResourceFiltersAndTransforms();
  }
}
```

#### 4. Apply Filters and Transforms

```typescript
private applyResourceFiltersAndTransforms(): void {
  // STEP 2: Apply filters
  this.applyFilter('status', (row) => row['status'] === 'active');
  this.applyFilter('type', (row) => row['type']?.includes('specificType'));
  
  // STEP 3: Sort data
  this.sortData(['meta.lastUpdated', 'date'], false); // false = descending
  
  // STEP 4: Combine referenced resources (if needed)
  this.combineReferencedResources(
    [{ resourceType: 'Patient', attachKey: 'patientDetails' }],
    'subject' // field containing the reference
  );
  
  // STEP 5: Transform data
  this.transformData((row) => ({
    ...row,
    displayName: row.name || row.title || 'Unnamed',
    lastUpdated: row.meta?.lastUpdated
  }));
  
  // STEP 6: Organize search filters for UI
  this.organizingSearchFilters(new Map<string, any[]>([
    ['status', ['active', 'inactive', 'suspended']],
    ['type', ['typeA', 'typeB', 'typeC']]
  ]));
}
```

#### 5. Cleanup on Destroy

```typescript
override ngOnDestroy(): void {
  // Clean up org-wide resources for this resource type
  console.log('Cleaning up resources from orgWideResources');
  
  if (this.stateService.orgWideResources.resourceType) {
    this.stateService.orgWideResources.resourceType.next([]);
  }
  
  // Call parent cleanup
  super.ngOnDestroy?.();
}
```

---

## Permission Management

### Using Computed Permissions

#### ✅ DO: Call Inherited computePermissions Method

```typescript
override ngOnInit(): void {
  // This sets inherited canAdd$ and canExport$ observables
  this.computePermissions('resourceType');
  
  // Use inherited observables in template
  // canAdd$ and canExport$ are now available
}
```

#### Template Usage

```html
<!-- Use inherited permission observables directly -->
@if (canAdd$ | async) {
  <button mat-flat-button (click)="onAddResource()">
    <mat-icon>add</mat-icon>
    Add Resource
  </button>
}

@if (canExport$ | async) {
  <button mat-flat-button (click)="onExportResources()">
    <mat-icon>file_download</mat-icon>
    Export
  </button>
}
```

#### ❌ DON'T: Create Redundant Permission Observables

```typescript
// ❌ WRONG - These duplicate inherited canAdd$ and canExport$
canAddServiceCode$ = new BehaviorSubject<boolean>(false);
canExportServiceCode$ = new BehaviorSubject<boolean>(false);
```

### Adding New Resource Permissions

When adding a new resource type, update `capacityObject` in `auth.service.ts`:

```typescript
export const capacityObject = {
  // ...existing resources...
  
  newResourceType: {
    add: ['admin'],
    viewAll: ['admin', 'doctor', 'nurse'],
    view: ['admin', 'doctor', 'nurse'],
    update: ['admin'],
    delete: ['admin'],
    export: ['admin']
  }
}
```

---

## State Management

### StateService Resource Structure

All resources in StateService follow this pattern:

```typescript
resourceType: new BehaviorSubject<Array<{
  referenceId: string | null,
  savedStatus: 'saved' | 'unsaved',
  actualResource: ResourceType
}>>([])
```

### Adding New Resource to StateService

#### 1. Add to orgWideResources

```typescript
// In state.service.ts
orgWideResources = {
  // ...existing resources...
  
  newResourceType: new BehaviorSubject<Array<{
    referenceId: string | null,
    savedStatus: 'saved' | 'unsaved',
    actualResource: NewResourceType
  }>>([])
}
```

#### 2. Update processOrgWideBundleTransaction

```typescript
private addResourceToOrgWideResources(resource: Resource, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
  const referenceId = this.toRefId(resource);
  switch (resource.resourceType) {
    // ...existing cases...
    
    case 'NewResourceType':
      this.upsertToSubject(this.orgWideResources.newResourceType, {
        referenceId,
        savedStatus,
        actualResource: resource as NewResourceType
      });
      break;
  }
}
```

#### 3. Load in App Wrapper Resolver (if needed)

```typescript
// In app-wrapper-data.resolver.ts
return forkJoin({
  // ...existing resources...
  
  newResources: http.get<Bundle<NewResourceType>>(`${baseUrl}/NewResourceType?_count=199`).pipe(
    map(bundleToResources),
    catchError(() => of([]))
  )
}).pipe(
  tap(({ newResources }) => {
    stateService.orgWideResources.newResourceType.next(
      newResources.map(res => ({
        referenceId: res.id ? `NewResourceType/${res.id}` : null,
        savedStatus: 'saved',
        actualResource: res
      }))
    );
  })
)
```

---

## Code Style Guidelines

### Do's and Don'ts

#### ✅ DO:
- Extend `AdmittedPatientsComponent` for list components
- Use `override` keyword when overriding parent methods/properties
- Call `super.ngOnInit?.()` and `super.ngOnDestroy?.()` when overriding lifecycle hooks
- Use inherited services (`this.http`, `this.router`, `this.dialog`, etc.)
- Clean up subscriptions and state in `ngOnDestroy`
- Use `computePermissions()` for permission checks
- Follow the 6-step data processing flow (subscribe → filter → sort → combine → transform → organize filters)
- Use `console.log` statements to track data flow during development

#### ❌ DON'T:
- Re-declare services that exist in parent component
- Create redundant permission observables
- Manually connect table data source when using `initiateDataSourceSubscription`
- Re-implement filter initialization logic (use inherited methods)
- Forget to clean up resources in `ngOnDestroy`
- Hard-code backend URLs (use injected `backendUrl` token)

### Variable Naming Conventions

```typescript
// Resource-specific names
resourceTableFilter: Map<string, any[]>         // Filters configuration
resourceTableFilterArray: Map<string, any[]>    // Same as above, for template
resourceFiltersFormControlObject: any          // Form controls for filters
resourceDetailsBuilder: DetailsBuilderObject   // Details view configuration

// Inherited from base (DON'T re-declare)
tableDataSource: MatTableDataSource            // Table data source
tableDataLevel2: BehaviorSubject               // Observable table data
displayedColumns: string[]                     // Table column names
canAdd$: Observable<boolean>                   // Permission observable
canExport$: Observable<boolean>                // Permission observable
```

### File Structure

```
src/app/
├── resource-list/
│   ├── resource-list.component.ts        # Component class
│   ├── resource-list.component.html      # Template
│   ├── resource-list.component.scss      # Styles
│   └── add-resource/                     # Nested add/edit components
│       ├── add-resource.component.ts
│       ├── add-resource.component.html
│       └── add-resource.component.scss
├── admitted-patients/
│   └── admitted-patients.component.ts    # Base class for list components
├── shared/
│   ├── state.service.ts                  # Central state management
│   ├── auth/
│   │   └── auth.service.ts               # Authentication & permissions
│   └── ...
└── app.routes.ts                          # Route definitions
```

---

## Example: Complete List Component

### Minimal Complete Example

```typescript
// filepath: src/app/my-resource-list/my-resource-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdmittedPatientsComponent } from '../admitted-patients/admitted-patients.component';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-resource-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './my-resource-list.component.html',
  styleUrls: ['./my-resource-list.component.scss']
})
export class MyResourceListComponent extends AdmittedPatientsComponent implements OnInit, OnDestroy {
  override displayedColumns: string[] = ['name', 'status', 'actions'];
  
  resourceDetailsBuilder: DetailsBuilderObject = {
    resourceName: 'My Resource',
    resourceIcon: 'star',
    specialHeader: {
      strongSectionKey: 'name',
      iconSectionKeys: ['status'],
      contentSectionKeys: ['date']
    },
    groups: [
      {
        groupName: 'Details',
        groupIcon: 'info',
        groupKeys: ['name', 'status', 'description']
      }
    ]
  };

  override ngOnInit(): void {
    this.computePermissions('myResourceType');
    this.loadOrgWideResources();
  }

  private loadOrgWideResources(): void {
    const current = this.stateService.orgWideResources.myResourceType.getValue();
    
    if (!current?.length) {
      this.http.get(`${this.backendUrl}/MyResourceType?_count=500`).subscribe({
        next: (bundle: any) => {
          this.stateService.processOrgWideBundleTransaction(bundle);
          this.initiateDataSourceSubscription(this.stateService.orgWideResources.myResourceType);
          this.applyFiltersAndTransforms();
        },
        error: (err) => this.errorService.openandCloseError('Failed to load resources')
      });
    } else {
      this.initiateDataSourceSubscription(this.stateService.orgWideResources.myResourceType);
      this.applyFiltersAndTransforms();
    }
  }

  private applyFiltersAndTransforms(): void {
    this.applyFilter('status', (row) => row['status'] === 'active');
    this.sortData(['meta.lastUpdated'], false);
    this.transformData((row) => ({ ...row, displayName: row.name || 'Unnamed' }));
    this.organizingSearchFilters(new Map([['status', ['active', 'inactive']]]));
  }

  onAddResource(): void {
    this.router.navigate(['/app/my-resources/add']);
  }

  showRow(row: any): void {
    this.dialog.open(DetailzViewzComponent, {
      data: {
        resourceData: row,
        detailsBuilderObject: this.resourceDetailsBuilder
      }
    });
  }

  override ngOnDestroy(): void {
    this.stateService.orgWideResources.myResourceType?.next([]);
    super.ngOnDestroy?.();
  }
}
```

---

## Testing Checklist

Before submitting a resource list component, verify:

- [ ] Component extends `AdmittedPatientsComponent`
- [ ] No re-declared services from parent
- [ ] Uses inherited `canAdd$` and `canExport$` observables
- [ ] Calls `computePermissions()` in `ngOnInit`
- [ ] Implements proper data loading pattern
- [ ] Applies filters and transforms using inherited methods
- [ ] Cleans up resources in `ngOnDestroy`
- [ ] Permissions added to `capacityObject` in auth.service.ts
- [ ] Resource type added to StateService if new
- [ ] Route configured in app.routes.ts
- [ ] Menu link added to sidemenu.component.ts (if needed)
- [ ] Template uses `canAdd$ | async` and `canExport$ | async`
- [ ] Empty state component shown when no data

---

## Common Pitfalls to Avoid

### 1. Re-declaring Inherited Services
**Problem:** Creates duplicate service instances and breaks dependency injection chain.
```typescript
// ❌ WRONG
private http = inject(HttpClient);

// ✅ CORRECT - Already inherited from AdmittedPatientsComponent
// Just use: this.http
```

### 2. Creating Redundant Permission Variables
**Problem:** Duplicates inherited permission observables.
```typescript
// ❌ WRONG
canAddResource$ = new BehaviorSubject<boolean>(false);

// ✅ CORRECT - Use inherited canAdd$
// Template: @if (canAdd$ | async) { ... }
```

### 3. Manual Table Connection
**Problem:** Redundant when using `initiateDataSourceSubscription`.
```typescript
// ❌ WRONG - Don't do both
this.tableDataSource.connect = () => this.tableDataLevel2;
this.initiateDataSourceSubscription(source);

// ✅ CORRECT - Just use initiateDataSourceSubscription
this.initiateDataSourceSubscription(source);
```

### 4. Forgetting to Clean Up
**Problem:** Memory leaks and stale data.
```typescript
// ❌ WRONG - No cleanup
override ngOnDestroy(): void {
  // Nothing here
}

// ✅ CORRECT
override ngOnDestroy(): void {
  this.stateService.orgWideResources.myResource?.next([]);
  super.ngOnDestroy?.();
}
```

---

## Questions?

If you encounter issues or have questions about these patterns:

1. Check `admitted-patients.component.ts` for the base class implementation
2. Review existing list components (e.g., `service-request-codes-list.component.ts`, `specimens.component.ts`)
3. Consult the StateService documentation for resource management
4. Check auth.service.ts for permission configuration examples

---

**Last Updated:** 2025
**Maintained By:** elikita-frontend Development Team
