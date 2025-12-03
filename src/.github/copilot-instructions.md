# Copilot instructions for `elikita-frontend`

## Project Overview
Angular 19 FHIR-based Electronic Health Records (EHR) system using standalone components, reactive forms, and Material Design. Backend: `https://elikita-server.daalitech.com` (FHIR R4 server). Frontend handles patient management, clinical encounters, medication tracking, lab requests, and billing workflows.

## Architecture & Routing
- **Modern Angular**: Use `@if()` instead of `*ngIf`, `@for` instead of `*ngFor`, standalone components only—no NgModules.
- **Bootstrap**: `src/main.ts` calls `bootstrapApplication(AppComponent, appConfig)` with standalone config. Every component declares its own `imports` array.
- **Route Structure**: `app/app.routes.ts` splits:
  - `/testing/*` — Sandbox routes bypassing guards/resolvers for rapid prototyping
  - `/app/*` — Guarded production routes via `AppWrapperComponent` + `appAuthGuard` + `appWrapperDataResolver`
- **Route Metadata**: Always set `data: { title, breadCrumbTitle, breadCrumbIcon, roles }` so `BreadcrumbService` and sidebar navigation builders stay consistent. Example:
  ```typescript
  data: { title: 'Patient Registration', breadCrumbTitle: 'Patient Registration', breadCrumbIcon: 'person_add', roles: ['admin', 'receptionist'] }
  ```

## Data Layer & Resolvers
- **FHIR Bundles**: Single source of truth. Resolvers (`patients.resolver.ts`, `appointment.resolver.ts`, `pat-obs.resolver.ts`) fetch from `https://elikita-server.daalitech.com`, unwrap `entry[].resource`, and fallback to JSON fixtures on network failure.
- **Resolver Pattern**: Use `catchError()` to gracefully handle network failures. Return empty arrays (`of({ entry: [] })`) to prevent route blocking. Example:
  ```typescript
  return http.get<Bundle>(`${backendUrl}/Patient?_count=200`).pipe(
    map(bundle => bundle.entry?.map(e => e.resource) ?? []),
    catchError(() => of([]))
  );
  ```
- **Base URLs**: Inject `backendEndPointToken`, `backendUrlforSamplesToken` from `app/app.config.ts`—never hard-code URLs.
- **Organization-Wide Data**: `appWrapperDataResolver` pre-loads patients, locations, specimens, medications, requests into `StateService.orgWideResources` BehaviorSubjects for global reference lists.

## HTTP, Caching & Loading
- **Interceptor**: `loading.interceptor.ts` wraps every request with `LoaderComponent` modal, caches GET responses in `CacheStorageService`, auto-adds `&_sort=-date` to `_count=200` queries.
- **Cache Invalidation**: POST/PUT/PATCH/DELETE invalidate cache keys matching the resource base URL (e.g., `/Patient/{id}` write clears `/Patient?*` collection caches).
- **Silent Calls**: Set `req.context.set(LoadingUIEnabled, false)` to skip loader modal (e.g., background polling).
- **Double Loading Prevention**: Router-level spinners use `LoaderService` in `AppComponent`; HTTP spinners use the interceptor—avoid manual `MatDialog` loaders.

## Authentication & Authorization
- **AuthService**: `shared/auth/auth.service.ts` holds user in `BehaviorSubject<User | null>`. Fake logins: `doctor123/doctor123`, `pharmacy123/pharmacy123`, `nurse123`, `admin123`, etc.
- **Capacity Object**: Role-based permission map (`capacityObject`) defines actions per resource (e.g., `patient: { add: ['admin', 'receptionist'], viewAll: ['admin', 'doctor', 'nurse'] }`). Use `auth.can('patient', 'add')` before rendering restricted UI.
- **Guard**: `appAuthGuard` redirects unauthenticated users to `/login`, stores attempted URL in `auth.triedUrl` for post-login redirect.
- **Dev Mode**: `AppComponent.ngOnInit()` auto-logs in as `doctor123` and routes to a specific patient page for rapid development. Change `target` variable locally but commit the default.

## Form engine & FHIR encoding
- `shared/dynamic-forms-v2` builds nested `FormGroup`/`FormArray` trees from each field’s `generalProperties` (type, `isGroup`, `isArray`, validators). Use `controllingField` definitions plus matching `dependency-id` attributes in templates to toggle dependent sections.
- Codeable concepts and references are encoded using the literal text `dollar-hash-dollar` between segments (example: `code-dollar-hash-dollar-display-dollar-hash-dollar-system`); utilities like `SplitHashPipe`, `form-fields-select-data.service.ts`, and `patient-wrapper/encounter-service.service.ts` expect that delimiter, so never change it when persisting values.
- Backend-driven picklists set `field.generalProperties.fieldType === 'CodeableConceptFieldFromBackEnd'`; supply the search URL and let `DynamicFormsV2Component.searchCodeableConceptFromBackEnd` populate `backendOptions`. Set `generalProperties.allowedOthers = true` to auto-open `AddOtherDialogComponent` for free-text entries.

## Patient review & downstream transforms
- `shared/patient-data-review` (see its README) mirrors the dynamic-form schema, emits `FieldEditEvent`, and feeds services like `shared/fhir-resource-transform.service.ts`; wire `fieldEdited` to re-run your FHIR transforms instead of mutating raw objects.
- `patient-wrapper/encounter-service.service.ts` centralizes how encounters, meds, and observations become FHIR bundles; reuse its helpers when pushing new clinical actions so dollar-hash-dollar strings and reference paths stay valid.

## File uploads & external services
- `UploadUiComponent` + `AzureUploadService` already enforce file-type regexes, max counts, SAS-token validation, upload progress, and deletion—expose a short-lived SAS via the `azureSasToken` input and listen to `(filesChanged)` for `{ url, fileName, mime, azureBlobName }` metadata to store alongside form data.
- If you need other blob containers, pass `azureStorageAccountName`/`azureContainerName` via inputs rather than editing the defaults committed for demos.

## Loading, notifications, and dialogs
- Router-level spinners run through `LoaderService` in `AppComponent`, while HTTP spinners live in the interceptor; avoid manual `MatDialog` loaders so users don’t see double overlays.
- Non-blocking toasts come from `NotificationService` (auto-dismiss BehaviorSubject), and blocking alerts use `ErrorService.openandCloseError` (Material dialog that auto-closes in 3 s). Reuse these instead of `window.alert` for consistency.

## Sample data & sandboxes
- JSON fixtures in `public/` (`*bundle.json`, `sample_fhir_patients.json`, etc.) mirror FHIR responses; point resolvers to them or fetch via `HttpClient` when the remote server is down.
- Prototype UI/flows under `/testing/...` routes—they bypass guards and resolvers so you can iterate quickly; once data requirements solidify, move the feature under `/app` and hook it into the relevant resolvers.

## Build & test workflow
- Run commands from the repo root (one level up from `src/`): `npm install`, `npm start` (alias for `ng serve`) during dev, `npm run build` for production bundles, and `npm test` for Karma/Jasmine specs.
- `ng lint` (if enabled) plus Angular's strict template checks will fail if a control is referenced before it exists—declare reactive controls in the component before binding to them in HTML.

## State Management & Services
- **StateService**: `shared/state.service.ts` holds `orgWideResources` (patients, locations, specimens, medications, etc.) in BehaviorSubjects. Populated by `appWrapperDataResolver` on `/app` entry. Subscribe to these for global reference lists (e.g., patient picker dropdowns).
- **Encounter State**: `EncounterServiceService.globalEncounterState` tracks per-patient encounter statuses (planned, in-progress, completed, etc.). Check before allowing clinical actions.

## Key Patterns & Conventions
- **FHIR IDs**: Always check `resource.id` existence before building references (`Patient/${id}`). Handle missing IDs gracefully.
- **Reference Display**: `ReferenceDisplayDirective`, `reference-display.service.ts`, `references2.pipe.ts` auto-resolve FHIR references to human-readable text (e.g., `Patient/123` → "John Doe").
- **Material Design**: Use `--mat-sys-primary`, `--mat-sys-on-surface`, `--mat-sys-outline-variant` CSS variables for theming. Avoid hard-coded colors.
- **Date Formatting**: Prefer `toLocaleDateString()` or Angular `DatePipe` over manual string formatting.
- **Reactive Forms**: Always declare form controls in component constructor/`ngOnInit` before referencing in template. Use `FormBuilder` for nested groups/arrays.

## Common Pitfalls
- **Don't mutate FHIR resources directly** — clone before modifying, or use transform services.
- **Don't hard-code URLs** — inject tokens from `app.config.ts`.
- **Don't bypass `$#$` encoding** — all CodeableConcept/Reference transforms expect this format.
- **Don't create duplicate loaders** — HTTP interceptor + `LoaderService` already handle all loading states.
- **Don't use `*ngIf`/`*ngFor`** — migrate to `@if()`/`@for()` control flow (Angular 19+).

## Testing Different Roles
Change auto-login in `AppComponent.ngOnInit()`:
```typescript
this.auth.login('doctor123', 'doctor123');     // Doctor
this.auth.login('pharmacy123', 'pharmacy123'); // Pharmacist
this.auth.login('nurse123', 'nurse123');       // Nurse
this.auth.login('admin123', 'admin123');       // Admin
this.auth.login('lab123', 'lab123');           // Lab Technician
```
Adjust `target` route to test specific workflows. Commit with default values for team consistency.
