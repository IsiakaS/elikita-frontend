# AI Prompt: Building Dynamic Forms in elikita-frontend

Use this prompt when you need to create or modify FHIR-based forms using the `DynamicFormsV2Component` pattern.

## Context for AI

This Angular 19 application uses a dynamic form engine (`shared/dynamic-forms-v2`) to build FHIR R4 resource forms. Forms fetch dropdown data from backend ValueSets/Bundles, render fields based on metadata, and POST normalized FHIR resources back to `https://elikita-server.daalitech.com`.

## When to use this pattern

- Adding clinical data entry (diagnoses, observations, medications, specimens, procedures)
- Creating or editing FHIR resources through dialogs
- Building forms that need backend-driven picklists or autocomplete

## Step-by-step implementation

### 1. Data fetching (use `FormFieldsSelectDataService`)

**What to do:**
- Call `formFieldsDataService.getFormFieldSelectData(feature, field)` inside a `forkJoin` to fetch dropdown options in the components or service that wants to use the `shared/dynamic-forms-v2` either through dialogs or through components referenced in the template.
-Two things have been implemented here, but might need adjustment and so you might need to go into the 
`FormFieldsSelectDataService` to do some adjustment mentioned below
- First is that urls are included in the urls config for each resources. these urls are used for getting dropdowns for CodeableConcept and Reference Fields
-Urls for CodeableConcept fields are uually from public server tat are recommended in fhir4 documnetation
-Urls for references are from the server's backend which its baseUrl is injected to the service as a `backendApiEndpoint`
- second is that a method is also icluded for the specific resoure in the srvice's transform object. The CodeableConcept fields should have a method tha will call the `baseFunctionToRetrieveValueSet`
The Reference fields , if it is a field related to practitioner should call the `practitionerBundeToReferenceData`. If it's related to a patient, should call the `patientBundleToReferenceData`. If it'S related to ServiceRequest, should call the `serviceRequestBundleToReferenceData`. If it's anthing other than his a new method should be built by looking at how `practitionerBundeToReferenceData` and `patientBundleToReferenceData` and `serviceRequestBundleToReferenceData` are built
- Confirm that the urls referenced in `formFieldsDataService.getFormFieldSelectData(feature, field)` will actually fetch data 
- If the url is not working, check external fhir  resurce for url that can be used
- sometimes, the urls won't return values because the valueset is large, and would only return values when there is a iltering parameter, in this case, a dummy.json is put in the `allUrls` configuraion for te resource fields and then in the transform method an array with a single element of te actual url is returned

- Add any missing endpoints to `FormFieldsSelectDataService.allUrls` under the appropriate feature key.


**How to A

**Example:**
```typescript
forkJoin({
  clinicalStatus: this.formFieldsDataService.getFormFieldSelectData('condition', 'clinicalStatus'),
  severity: this.formFieldsDataService.getFormFieldSelectData('condition', 'severity'),
  code: this.formFieldsDataService.getFormFieldSelectData('condition', 'code')
}).subscribe(data => {
  // Use data.clinicalStatus, data.severity, data.code in formFields
});
```

### 2. Field type selection (choose appropriate `fieldType`)

| Use case | `fieldType` | UI rendered | FHIR output |
|----------|-------------|-------------|-------------|
| Simple dropdown/radio (static list) | `SingleCodeField` | `<mat-select>` or radio | string or `CodeableConcept.text` |
| Coded concept (pre-supplied codings) | `CodeableConceptField` | Dropdown | `CodeableConcept` with coding array |
| Backend autocomplete (ValueSet URL) | `CodeableConceptFieldFromBackEnd` | Autocomplete | `CodeableConcept` from selection |
| Text/number/date input | `IndividualField` | `<input>` / `<textarea>` | Scalar (string, number, datetime) |
| FHIR reference picker | `IndividualReferenceField` | Reference picker | `Reference` object |
| Nested structure | `GroupField` | Composite section | Nested FHIR structure |

- Additional notes. `CodeableConceptFieldFromBackEnd` is used for fields that their url in the allUrls object in the `FormFieldsSelectDataService` is dummy.json
- For singleCode fieldype, the data is provided in the actual data property , not from the forkjoins data. examples of these are the status fields. They use the string[] type and the elements are not so much, reason why theya re hardcoded in the configs but a knowledge of fhir 4 field and resources is neded for this as the data is dependent on the resource and the field
-some inputType uh as toggle is used for fhir4 fields that are of the boolean type


### 3. Building `FormFields[]` array

**Required `generalProperties`:**
- `fieldApiName`: Machine key matching FHIR property name
- `fieldType`: One of the types above
- `label`: Display text
- `auth`: `{ read: ['role1'], write: ['role2'] }` (use `['*']` for all roles)
- `validations`: `{ required: true }` or custom validators
- `value`: Default value (can be empty)
- `fieldHint` is the actua property that works for the longer hint that shows at the bottom of the matformf-ield
- `allowedOthers`: true is mostly used for fiels wt `CodeableConceptFieldFromBackEnd` and some `CodeableConcept` fields which its fhir4 spec do not cassify thier binding srength as required.

**Example field definition:**
```typescript
const clinicalStatusField: SingleCodeField = {
  generalProperties: {
    fieldApiName: 'clinicalStatus',
    fieldType: 'SingleCodeField',
    label: 'Clinical Status',
    value: 'active',
    auth: { read: ['*'], write: ['doctor', 'nurse'] },
    validations: { required: true },
    isHidden: false
  },
  data: data.clinicalStatus // From forkJoin
};
```



### 4. Opening the dialog

**Pattern:**
```typescript
- if its called though a dialog 
const dialogRef = this.dialog.open(DynamicFormsV2Component, {
  data: {
    formMetaData: {
      formName: 'Resource Name Form',
      submitText: 'Save Resource',
      cancelText: 'Cancel'
    },
    formFields: [
      clinicalStatusField,
      verificationStatusField,
      codeField,
      onsetDateTimeField
    ]
  },
  width: '600px',
  disableClose: true
});
-if its call in the template
  <app-dynamic-forms-v2 [formFields]="labFormFields" [formMetaData]="labFormMetaData"
            (formSubmitted)="submitLabResult($event)">

        </app-dynamic-forms-v2>
```

### 5. Handling form submission

**Steps:**
1. Subscribe to `dialogRef.afterClosed()`
2. Check if result exists (user didn't cancel)
the dialog wil return the values as a values field in the event object from the next property in the ubscribe callback
3. Normalize coded fields using `FhirResourceTransformService` services method transformValues(
        resourceType: string,
        data: Record<string, any>,
        passthrough: string[] = []
    ):
   ```typescript
   
   // Converts "code$#$display$#$system" → { coding: [...], text: "..." }
   ```
4. Build FHIR resource with references from `StateService` and `AuthService`
- It means some fields values are automatically injected here, fields relted to practitioner 
are hecked and if there is no value, the currently loggedin practitioner reference is gotten from the app and used. for patient, the ptient reference is either gotten from the resolved data or from current encounter patient. Sometimes the functions that call the form will also have some parameters that can be used to field some of the fields automatically
- check if some values that you think should be required ar recommended are included and i not, issue an error with `ErrorService.openandCloseError` and return

5. POST to backend with `postResource(resourceType: string, values: any, opts?: PostOpts)` funtion in 
`fhir-resource-service` and subscribe to it
6. On success, store in `StateService.persistLocalResource`
7. On error, call `ErrorService.openandCloseError`

**Example:**
```typescript
dialogRef.afterClosed().subscribe(result => {
  if (!result || !result.code) return;

  

 this.fhirResourceService.postResource({'Condition', this.FhirResourceTransformService.transformValues('Condition', result.values) }).subscribe({
      next: () =>   {
        this.sn.openFromComponent(SuccessMessageComponent, {
          data: { message: 'Medication, inventory and pricing saved successfully.' },
          duration: 3000
        });
        
      },
      error: (err: any) => {
        console.error('Failed to submit medication bundle:', err);
        this.erroServ.openandCloseError('Failed to submit medication record. Please try again.');
      }
    });
});
```


```

**Getting current references:**
```typescript
// Patient reference
const patientRef = { reference: `Patient/${this.patientId}` };

// Encounter reference
const encounterRef = { 
  reference: `Encounter/${this.encounterService.activeEncounterId}` 
};

// Practitioner reference
const practitionerRef = this.stateService.getPractitionerReference();
```

## Common pitfalls to avoid

1. **Don't hard-code URLs** – inject `backendEndPointToken` from `app.config.ts`
2. **Don't skip auth guards** – always set `auth: { read: [...], write: [...] }` on fields
3. **Don't mutate state directly** – use `StateService.persistLocalResource` after POST
4. **Don't forget `Prefer: return=representation`** – ensures server returns the saved resource with ID
5. **Don't bypass the cache** – let `loading.interceptor.ts` handle caching; only disable for special cases
6. **Don't use `alert()`** – use `NotificationService` or `ErrorService` for consistency

## Testing the implementation

1. **Check dropdown population**: Open browser console, verify `forkJoin` resolves with arrays
2. **Inspect form payload**: Add `console.log(result)` in `afterClosed` to see field values
3. **Validate FHIR resource**: Use FHIR validator or check against R4 spec before POSTing
4. **Test error paths**: Disconnect network, verify `ErrorService` shows dialog
5. **Verify cache**: Check Network tab—second load should hit cache, not server

## Example: Complete addDiagnosisV2 flow

```typescript
addDiagnosisV2() {
  // 1. Pre-checks
  if (!this.stateService.isEncounterActive()) {
    this.errorService.openandCloseError('No active encounter');
    return;
  }

  // 2. Fetch data
  forkJoin({
    clinicalStatus: this.formFieldsDataService.getFormFieldSelectData('condition', 'clinicalStatus'),
    code: this.formFieldsDataService.getFormFieldSelectData('condition', 'code')
  }).subscribe(data => {
    // 3. Build fields
    const formFields: FormFields[] = [
      {
        generalProperties: {
          fieldApiName: 'clinicalStatus',
          fieldType: 'SingleCodeField',
          label: 'Clinical Status',
          value: 'active',
          auth: { read: ['*'], write: ['doctor'] },
          validations: { required: true }
        },
        data: data.clinicalStatus
      },
      {
        generalProperties: {
          fieldApiName: 'code',
          fieldType: 'CodeableConceptFieldFromBackEnd',
          label: 'Diagnosis',
          searchUrl: `${this.backendEndPoint}/ValueSet/$expand?url=http://...`,
          allowedOthers: true,
          auth: { read: ['*'], write: ['doctor'] },
          validations: { required: true }
        }
      }
    ];

    // 4. Open dialog
    const dialogRef = this.dialog.open(DynamicFormsV2Component, {
      data: {
        formMetaData: { formName: 'Add Diagnosis', submitText: 'Save' },
        formFields
      },
      width: '600px'
    });

    // 5. Handle submission
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.code) return;

      const condition: Condition = {
        resourceType: 'Condition',
        clinicalStatus: this.turnToCodeableConcept(result.clinicalStatus),
        code: this.turnToCodeableConcept(result.code),
        subject: { reference: `Patient/${this.patientId}` },
        encounter: { reference: `Encounter/${this.encounterService.activeEncounterId}` },
        recorder: this.stateService.getPractitionerReference(),
        recordedDate: new Date().toISOString()
      };

      this.http.post(`${this.backendEndPoint}/Condition`, condition, {
        headers: { 'Prefer': 'return=representation' }
      }).subscribe({
        next: (saved) => {
          this.stateService.persistLocalResource(saved);
          this.notificationService.showSuccess('Diagnosis saved');
        },
        error: (err) => this.errorService.openandCloseError(err)
      });
    });
  });
}
```

## Instructions for AI

When asked to build a form:
1. Ask which FHIR resource type (Condition, Observation, MedicationRequest, Specimen, etc.)
2. Identify required fields from FHIR R4 spec
3. Check if dropdown endpoints exist in `FormFieldsSelectDataService.allUrls`—if not, ask where to fetch them
4. Generate the `FormFields[]` array with correct `fieldType` for each property
5. Provide the dialog opening code
6. Show the submission handler with FHIR resource construction
7. Include error handling and state persistence

Always follow the `dollar-hash-dollar` delimiter convention and inject tokens from `app.config.ts`.
