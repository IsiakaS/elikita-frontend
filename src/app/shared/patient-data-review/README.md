# Patient Data Review Component

A reusable Angular component for reviewing and editing patient registration data. Works in both standalone mode (embedded) and dialog mode.

## Features

- **Dual Mode Support**: Can be used as a standalone component or opened in a dialog
- **Real-time Updates**: Emits field edit events immediately in standalone mode
- **Granular Editing**: Separate edit controls for simple fields vs array elements
- **Array Grouping**: Array elements are grouped by field name with collective add/delete functionality
- **Add/Delete Array Items**: Each array group has an "Add" button, and each item has a "Delete" button
- **Individual Array Editing**: Each array element can still be edited individually
- **FHIR Compliant**: Designed to work with FHIR R4 Patient data structures
- **Theme Aware**: Uses Material Design variables for light/dark mode support

## Installation

```typescript
import { PatientDataReviewComponent, FieldEditEvent } from './shared/patient-data-review/patient-data-review.component';
```

## Usage

### 1. Standalone Mode (Embedded in Template)

```html
<app-patient-data-review 
    [formFields]="designatedFormFields" 
    [submittedData]="submittedData"
    [showEditButtons]="true"
    [mode]="'standalone'"
    (fieldEdited)="onFieldEdited($event)"
    (navigateNext)="onNavigateToNext()">
</app-patient-data-review>
```

```typescript
export class YourComponent {
  designatedFormFields: any[] = [/* your form field definitions */];
  submittedData: any = {/* submitted form data */};

  // Handle real-time field edits
  onFieldEdited(event: FieldEditEvent) {
    console.log('Field edited:', event);
    
    // Update your data
    if (event.isArray && event.arrayIndex !== undefined) {
      this.submittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
    } else {
      this.submittedData[event.fieldApiName] = event.newValue;
    }

    // Re-transform to FHIR or update backend
    this.updateFhirPatient();
  }

  // Handle navigation
  onNavigateToNext() {
    // Navigate to next tab/step
    this.tabGroup.selectedIndex++;
  }
}
```

### 2. Dialog Mode

```typescript
import { MatDialog } from '@angular/material/dialog';
import { PatientDataReviewComponent } from './shared/patient-data-review/patient-data-review.component';

export class YourComponent {
  constructor(private dialog: MatDialog) {}

  openReviewDialog() {
    const dialogRef = this.dialog.open(PatientDataReviewComponent, {
      width: '900px',
      data: {
        formFields: this.designatedFormFields,
        submittedData: this.submittedData,
        showEditButtons: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
        
        switch (result.action) {
          case 'edited':
            // User edited data
            this.submittedData = result.submittedData;
            this.updateFhirPatient();
            break;
          case 'next':
            // User clicked "Save & Continue"
            this.submittedData = result.submittedData;
            this.navigateToNextStep();
            break;
          case 'cancel':
            // User closed without changes
            break;
        }
      }
    });
  }
}
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `formFields` | `any[]` | `[]` | Array of form field definitions (from dynamic forms) |
| `submittedData` | `any` | `{}` | The submitted form data to display/edit |
| `showEditButtons` | `boolean` | `true` | Whether to show edit buttons |
| `mode` | `'standalone' \| 'dialog'` | `'standalone'` | Component mode |

### Outputs (Standalone Mode Only)

| Output | Type | Description |
|--------|------|-------------|
| `fieldEdited` | `EventEmitter<FieldEditEvent>` | Emitted when a field is edited (real-time) |
| `navigateNext` | `EventEmitter<void>` | Emitted when "Continue" button is clicked |

### FieldEditEvent Interface

```typescript
export interface FieldEditEvent {
  fieldApiName: string;    // The API name of the field
  newValue: any;           // The new value
  isArray?: boolean;       // True if this is an array field
  arrayIndex?: number;     // Index of the array element (if isArray)
}
```

### Dialog Data Interface

```typescript
export interface PatientDataReviewConfig {
  formFields: any[];
  submittedData: any;
  showEditButtons?: boolean;
  mode?: 'standalone' | 'dialog';
}
```

### Dialog Result

```typescript
{
  submittedData: any;           // Updated data
  action: 'edited' | 'next' | 'cancel'  // What action triggered the close
}
```

## Field Categorization

The component automatically categorizes fields into:

1. **Simple Fields**: Non-array fields (name, gender, birthDate, etc.)
   - Grouped together with one "Edit Basic Info" button
   
2. **Array Fields**: Array fields (phone_telecom, address, etc.)
   - **Grouped by field name** (e.g., all phone numbers together, all addresses together)
   - Each group displays:
     * **Add button**: Add new items to the array
     * **Item count**: Shows how many items exist
     * **Individual items**: Each with edit ✏️ and delete 🗑️ buttons
   - Empty arrays show a helpful empty state message

## Value Formatting

The component includes smart formatting for:

- **Dates**: Formatted using `toLocaleDateString()`
- **Marital Status**: Extracts display value from `code$#$display$#$system` format
- **Name Groups**: Combines title, given, and family names
- **Arrays**: Joins array values with commas

## Styling

The component uses Material Design theme variables:

- `--mat-sys-primary`
- `--mat-sys-on-surface`
- `--mat-sys-outline-variant`
- `--mat-sys-surface-container-low`

Styles automatically adapt to light/dark themes.

## Array Management

### Adding Items

Each array field group has an "+ Add [Field Name]" button that:
1. Opens a dialog with a form for the new item
2. Pre-populates empty values based on field structure
3. Adds the new item to the array on submit
4. Emits a `fieldEdited` event with the updated array (standalone mode)
5. Re-categorizes and refreshes the display

### Editing Items

Each array item has an edit button (✏️) that:
1. Opens a dialog with the current item's values
2. Allows modification of that specific item
3. Updates the item at its specific index
4. Emits a `fieldEdited` event with array index (standalone mode)

### Deleting Items

Each array item has a delete button (🗑️) that:
1. Shows a confirmation dialog
2. Removes the item from the array
3. Emits a `fieldEdited` event with the updated array (standalone mode)
4. Re-categorizes and refreshes the display

All array operations emit real-time events in standalone mode, allowing parent components to:
- Update FHIR transformations immediately
- Sync with backend services
- Maintain data consistency

## Example: Complete Integration

```typescript
import { Component, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Patient } from 'fhir/r4';
import { PatientDataReviewComponent, FieldEditEvent } from './shared/patient-data-review/patient-data-review.component';

@Component({
  selector: 'app-patient-registration',
  template: `
    <mat-tab-group #tabGroup>
      <mat-tab label="Your Details">
        @if(showForm) {
          <app-dynamic-forms-v2 
            [formFields]="formFields"
            (formSubmitted)="onSubmit($event)">
          </app-dynamic-forms-v2>
        } @else {
          <app-patient-data-review 
            [formFields]="formFields"
            [submittedData]="submittedData"
            (fieldEdited)="onFieldEdited($event)"
            (navigateNext)="goToGuardianTab()">
          </app-patient-data-review>
        }
      </mat-tab>
      <mat-tab label="Guardian Details">
        <!-- Guardian form -->
      </mat-tab>
    </mat-tab-group>
  `
})
export class PatientRegistrationComponent {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  
  formFields: any[] = [];
  submittedData: any = {};
  showForm = true;
  fhirPatient: Patient | null = null;

  onSubmit(formData: any) {
    this.submittedData = formData;
    this.fhirPatient = this.transformToFhir(formData);
    this.showForm = false;
  }

  onFieldEdited(event: FieldEditEvent) {
    // Update data in real-time
    if (event.isArray && event.arrayIndex !== undefined) {
      this.submittedData[event.fieldApiName][event.arrayIndex] = event.newValue;
    } else {
      this.submittedData[event.fieldApiName] = event.newValue;
    }
    
    // Re-transform to FHIR
    this.fhirPatient = this.transformToFhir(this.submittedData);
  }

  goToGuardianTab() {
    this.tabGroup.selectedIndex = 1;
  }

  transformToFhir(data: any): Patient {
    // Your FHIR transformation logic
    return { resourceType: 'Patient', /* ... */ };
  }
}
```

## Benefits

✅ **Reusable**: Works in any component or dialog
✅ **Real-time Updates**: Immediate feedback in standalone mode
✅ **Flexible**: Supports both embedded and dialog usage
✅ **Type-safe**: TypeScript interfaces for all data structures
✅ **FHIR Ready**: Designed for FHIR data transformation
✅ **Accessible**: Material Design components with ARIA support
