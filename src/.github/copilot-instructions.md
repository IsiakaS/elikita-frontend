# Copilot instructions for `elikita-frontend`

## Architecture & routing
- Angular 19 uses standalone bootstrap in `src/main.ts`, so every component (e.g., `app/app.component.ts`) declares its own `imports`; there are no NgModules to patch.
- `app/app.routes.ts` splits sandboxes under `/testing` and the guarded shell under `/app` (`AppWrapperComponent` + `appAuthGuard` + `appWrapperDataResolver`). Always set `data.title`, `breadCrumbTitle`, `breadCrumbIcon`, and `roles` so `BreadcrumbService` and sidebar builders stay consistent.

## Data layer & resolvers
- FHIR bundles are the single source of truth: resolvers such as `patients.resolver.ts`, `appointment.resolver.ts`, `pat-obs.resolver.ts`, etc. fetch from `https://elikita-server.daalitech.com`, unwrap `entry[].resource`, and fall back to JSON fixtures in `public/` when the server fails—duplicate that pattern when adding routes.
- Base URLs and sample endpoints live in `app/app.config.ts` injection tokens (`backendEndPointToken`, `backendUrlforSamplesToken*`); inject those tokens instead of hard-coding URLs so environments swap cleanly.

## HTTP, loading, and caching
- `loading.interceptor.ts` wraps each request in a modal `LoaderComponent`, caches GETs inside `CacheStorageService`, and invalidates related keys after any write; only set `req.context.set(LoadingUIEnabled, false)` when you truly need a silent call.
- `_count=200` GETs are auto-cloned with `_sort=-date` in the interceptor and cache hits short-circuit via `HttpResponse`—keep new list calls idempotent so they benefit from the cache.

## Auth & navigation flows
- `AuthService` holds the user in a `BehaviorSubject`, fakes role-specific logins (`doctor123`, `pharmacy123`, etc.), and exposes `capacityObject` plus helpers like `auth.can('patient','add')`; use those checks before rendering gated UI.
- `AppComponent` auto-logs in as a pharmacy user and routes to `/app/medicine-stock` while recording `triedUrl`; when testing different flows, tweak the `target` locally but commit the original value.

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
- Run commands from the repo root: `npm install`, `npm start` (alias for `ng serve`) during dev, `npm run build` for production bundles, and `npm test` for Karma/Jasmine specs.
- `ng lint` (if enabled) plus Angular’s strict template checks will fail if a control is referenced before it exists—declare reactive controls in the component before binding to them in HTML.
