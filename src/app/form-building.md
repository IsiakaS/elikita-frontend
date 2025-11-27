# Dynamic form playbook (based on `addDiagnosisV2`)

## 1. Where dropdowns come from

1. Call `formFieldsDataService.getFormFieldSelectData(feature, field)` inside a `forkJoin`.
2. `FormFieldsSelectDataService.allUrls` holds every upstream endpoint (ValueSets, Bundles, dummy JSON).
3. The raw responses run through `transformValues` so callers always receive UI-ready arrays:
   - ValueSets → `"code$#$display$#$system"` strings or `{ system, concept[] }`
   - FHIR Bundles → `ReferenceDataType[]` with `{ reference, display }`
   - Local JSON → passthrough data
4. Example from `addDiagnosisV2`:
   ```ts
   forkJoin({
     code: this.formFieldsDataService.getFormFieldSelectData('condition', 'code')
   })
   ```
   resolves to a SNOMED/ICD ValueSet URL defined in `allUrls.condition.code`, ensuring diagnoses stay standardized.

## 2. Describing controls for `DynamicFormsV2Component`

Each control is a `FormFields` item:

| `fieldType`                    | Typical UI                      | FHIR R4 target on submit                      |
|-------------------------------|----------------------------------|-----------------------------------------------|
| `SingleCodeField`             | `<mat-select>` / radio list     | string code or `CodeableConcept.text`         |
| `CodeableConceptField`        | Dropdown w/ static coding list  | `CodeableConcept` (pre-supplied coding array) |
| `CodeableConceptFieldFromBackEnd` | Async autocomplete           | `CodeableConcept` constructed from selection  |
| `IndividualField`             | `<input>` / `<textarea>`        | scalar types (string, number, datetime, etc.) |
| `IndividualReferenceField`    | Reference picker                | `Reference` (`reference`, `display`)          |
| `GroupField`                  | Composite section               | Maps to nested structures (e.g., components)  |

Important `generalProperties` keys:
- `fieldApiName`: machine key used in the result payload.
- `auth`: guards which roles can read/write.
- `validations`, `allowedOthers`, `inputType`, `isHidden`: drive runtime behavior.
- `value`: default; `isArray`/`isGroup`: tell the renderer how to treat the control.

## 3. Inside `addDiagnosisV2`

1. **Pre-checks**: ensure an encounter is active (`state.isEncounterActive()`) and a `patientId` exists.
2. **Fetch select data**: obtain diagnosis codes via `getFormFieldSelectData('condition','code')`.
3. **Open dialog**:
   ```ts
   this.dialog.open(DynamicFormsV2Component, {
     data: {
       formMetaData: { formName: 'Diagnosis Form', submitText: 'Confirm Diagnosis', ... },
       formFields: [
         <SingleCodeField>{ ...clinicalStatus },
         <SingleCodeField>{ ...verificationStatus },
         <SingleCodeField>{ ...severity },
         <CodeableConceptFieldFromBackEnd>{ ...code },
         <IndividualField>{ ...onsetDateTime }
       ]
     }
   });
   ```
4. **Handle submission**:
   - Ensure required fields (diagnosis `code`) exist.
   - Normalize every coded field via `turnToCodeableConcept`, turning `"code$#$display$#$system"` into:
     ```json
     {
       "coding": [{ "system": "...", "code": "...", "display": "..." }],
       "text": "display"
     }
     ```
   - Build the Condition resource with encounter/patient/practitioner references and post to `${backendEndPoint}/Condition` using `Prefer: return=representation`.

## 4. Mapping UI → FHIR

- `SingleCodeField` values become primitive strings unless you explicitly wrap them.
  - `addDiagnosisV2` promotes `clinicalStatus`, `verificationStatus`, and `severity` into `CodeableConcept` blocks before POSTing.
- `CodeableConceptFieldFromBackEnd` already emits `CodeableConcept`-like value when the datasource is a ValueSet URL; the helper simply ensures text/coding are populated.
- Reference injections (patient, encounter, practitioner) come from `StateService` and `AuthService`, not the form itself.
- After POST, successful responses are pushed into `StateService.persistLocalResource` so cached data matches the server.

## 5. Posting strategy

1. Build the FHIR payload (e.g., `Condition`) from dialog results.
2. `this.http.post(`${backendEndPoint}/Condition`, body, { headers: { Prefer: 'return=representation' } })`.
3. On success, store the returned resource (with server-assigned `id`) in `StateService`.
4. On failure, route errors through `ErrorService.openandCloseError`.

## 6. Reusing the pattern for new forms

- **Plan data needs**: add any missing endpoints to `FormFieldsSelectDataService.allUrls` plus a transformer.
- **Assemble `FormFields[]`**: keep `fieldApiName` aligned with the FHIR property you plan to populate.
- **Normalize output**: coerce strings to proper FHIR datatypes (CodeableConcept, Reference, Quantity, etc.) before posting.
- **Leverage helpers**:
  - Use `utilityService.generateRequisition` or `stateService.getPractitionerReference` where appropriate.
  - For batched resources, follow the Encounter + Observations bundle example already in `EncounterServiceService`.

Following this template ensures every dialog consistently pulls its dropdowns, renders via `DynamicFormsV2Component`, and serializes back into FHIR R4 resources with minimal ad-hoc glue.
