# Patient Data Review Component - Visual Guide

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  Patient Data Review                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Basic Information                                     │   │
│  │ Your core patient details                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Name:           Mr. John Doe                        │   │
│  │  Gender:         Male                                │   │
│  │  Date of Birth:  01/15/1985                         │   │
│  │  Marital Status: Married                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                          [Edit Basic Info]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Phone Numbers                                         │   │
│  │ 2 item(s) - Click + to add or edit/delete items     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Item #1                            ✏️  🗑️      │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │  system:  phone                                │  │   │
│  │  │  value:   555-0123                            │  │   │
│  │  │  use:     mobile                              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Item #2                            ✏️  🗑️      │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │  system:  phone                                │  │   │
│  │  │  value:   555-0456                            │  │   │
│  │  │  use:     home                                │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                          [+ Add Phone Numbers]       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Addresses                                            │   │
│  │ 1 item(s) - Click + to add or edit/delete items     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Item #1                            ✏️  🗑️      │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │  line:    123 Main St, Apt 4                  │  │   │
│  │  │  city:    New York                            │  │   │
│  │  │  state:   NY                                  │  │   │
│  │  │  postalCode: 10001                           │  │   │
│  │  │  country: USA                                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                          [+ Add Addresses]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Email Addresses                                      │   │
│  │ 0 item(s) - Click + to add or edit/delete items     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  No email addresses added yet.                      │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                          [+ Add Email Addresses]     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│              [Continue to Next Step →]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Illustrated

### 1. **Array Field Grouping**
- All items of the same array field are grouped together
- Single card per array field (e.g., all phones, all addresses)
- Header shows field name and count

### 2. **Add Functionality**
- `[+ Add Phone Numbers]` button at bottom of each group
- Opens dialog with empty form for that field type
- Adds new item to the array

### 3. **Individual Item Controls**
- Each item has its own row with data
- **✏️ Edit button**: Opens dialog to edit that specific item
- **🗑️ Delete button**: Removes that specific item (with confirmation)

### 4. **Empty State**
- Arrays with no items show helpful message
- Still displays the "Add" button to populate

### 5. **Real-time Updates**
```typescript
// Standalone mode emits events for each action
(fieldEdited)="onFieldEdited($event)"

// Event includes:
{
  fieldApiName: 'phone_telecom',
  newValue: [...],  // Updated full array
  isArray: true,
  arrayIndex: 1     // Only for edits, not add/delete
}
```

## User Workflow Examples

### Adding a New Phone Number

1. User clicks `[+ Add Phone Numbers]`
2. Dialog opens with phone number form fields (system, value, use)
3. User fills in: system="phone", value="555-9999", use="work"
4. User clicks "Add"
5. New item appears as "Item #3" with edit/delete buttons
6. Parent component receives `fieldEdited` event with updated array
7. FHIR transformation updates automatically

### Editing an Address

1. User clicks ✏️ on "Item #1" under Addresses
2. Dialog opens with current values pre-filled
3. User changes city from "New York" to "Brooklyn"
4. User clicks "Save Changes"
5. Display updates with new value
6. Parent receives event with `arrayIndex: 0` and new value
7. submittedData[address][0] updates
8. FHIR Patient updates

### Deleting an Email

1. User clicks 🗑️ on unwanted email item
2. Confirmation dialog: "Are you sure you want to delete this Email Addresses?"
3. User confirms
4. Item removed from display
5. Remaining items renumbered (Item #2 becomes Item #1)
6. Parent receives event with updated array (minus deleted item)

## Data Flow

```
User Action (Add/Edit/Delete)
        ↓
Component Method (addArrayItem/editArrayItem/deleteArrayItem)
        ↓
Update submittedData array
        ↓
Re-categorize fields (update groupedArrayFields)
        ↓
Emit fieldEdited event (standalone mode)
        ↓
Parent Component receives event
        ↓
Parent updates FHIR transformation
        ↓
UI refreshes with new data
```

## Benefits

✅ **Organized Display**: Related items grouped together (all phones, all addresses)
✅ **Easy Addition**: Clear "Add" button for each field type
✅ **Safe Deletion**: Confirmation prevents accidental removal
✅ **Flexible Editing**: Edit individual items without affecting others
✅ **Real-time Sync**: Every change immediately emits to parent
✅ **Empty State Handling**: Clear messaging when arrays are empty
✅ **Index Safety**: Re-categorization ensures correct array indices after add/delete
