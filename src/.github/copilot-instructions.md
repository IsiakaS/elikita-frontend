# Copilot instructions for `elikita-frontend`

## Architecture snapshot
- Angular 17 standalone bootstrap (`main.ts` + `bootstrapApplication`) drives everything; there are no NgModules, so each component declares its own `imports` list (see `app/app.component.ts`).
- Routing is centralized in `app/app.routes.ts` with two major trees: `/testing` (experiments) and `/app` (guarded by `appAuthGuard` and hydrated via `appWrapperDataResolver`). Route `data` values (`title`, `breadCrumbTitle`, `breadCrumbIcon`) feed the breadcrumb service, so set them whenever you add navigation.
- Data is almost entirely FHIR-based. Resolvers such as `patients.resolver.ts`, `appointment.resolver.ts`, etc. prefetch bundles from `https://elikita-server.daalitech.com` before navigation, map `entry[].resource`, and fall back to safe defaults on errors—mirror that pattern for new resolvers.
- HTTP calls flow through `loading.interceptor.ts`, which opens a modal loader, deduplicates GET requests via `CacheStorageService`, and invalidates cache entries whenever a write occurs; non-GET requests should still go through the interceptor so cache stays coherent.

## Environment & workflows
- The repo surface here only shows `src/`; the Angular CLI workspace (with `package.json`, `angular.json`, etc.) lives at the repo root one level up. Run commands from that root: `npm install`, `ng serve --open` for dev, `ng test` for Karma specs, and `ng build --configuration production` for releases.
- Karma/Jasmine specs live next to their sources (`*.spec.ts`). Keep test doubles lightweight—most services use `BehaviorSubject`, so you can push fake values without complex schedulers. Prefer `HttpTestingController` when covering resolver logic.
- Lint/typecheck via `ng lint`; the project expects strict templates, so declare all reactive form controls before template access to avoid `NG0100` errors.

## API & data conventions
- Backend base URLs are provided via injection tokens in `app/app.config.ts` (`backendEndPointToken`, `backendUrlforSamplesToken*`). Always inject the token instead of hard-coding URLs so environments can swap endpoints.
- Codeable concepts are stored as concatenated strings built by inserting the literal text "dollar-hash-dollar" between code, display, and system (example: `123-dollar-hash-dollar-Acetaminophen-dollar-hash-dollar-http://foo`). Helpers like `displayConceptFieldDisplay` (in `shared/dynamic-forms-v2.component.ts`) and `patient-data-review` expect that exact delimiter, so preserve it whenever you build new values.
- Auto-complete fields keep their option lists in `DynamicFormsV2Component.searchableObject` keyed by `fieldApiName`. For backend-driven lists, `searchableObject[field]` is the search URL; `searchCodeableConceptFromBackEnd` inspects the URL to decide between FHIR ValueSet expansion vs. RxNorm (`transformRxNormToValueSet`).
- To support “Others” selections, set `generalProperties.allowedOthers = true`; the component will append the option and trigger `AddOtherDialogComponent` to collect the free-text value.

## UI & interaction patterns
- UI widgets are Angular Material-heavy plus a few third-party helpers (`flatpickr` for time pickers, `angular-calendar`, custom directives like `StretchDirective`). DOM-touching code (e.g., `@ViewChildren` logic in `dynamic-forms-v2.component.ts`) lives in `ngAfterViewInit`; keep new DOM work there to avoid SSR or hydration issues.
- Most shared widgets live under `app/shared/` (dynamic forms, patient review, upload UI, notifications, directives). Reuse them instead of reimplementing; e.g., `UploadUiComponent` + `AzureUploadService` already handle SAS validation, multi-file limits, and emits via `(filesChanged)`.
- Notifications go through `NotificationService` (auto-dismissed BehaviorSubject queue) and blocking alerts go through `ErrorService` (dialog that auto-closes in 3 seconds). Use these services for consistency instead of `window.alert`.
- Menus and mega lists rely on custom hover handling in `DynamicFormsV2Component.triggerForMatMenu`, which repositions overlays to stay within the viewport—reuse that helper for new cascading menus to avoid scroll issues.

## Auth, roles, and navigation flows
- `AuthService` fakes login via role-specific credentials (`pharmacy123`, `doctor123`, etc.), stores the result in a `BehaviorSubject`, and exposes a fine-grained `capacityObject` for RBAC checks (`auth.service.ts`). Call `auth.can('patient', 'add')` style helpers before rendering privileged UI.
- `AppComponent` auto-logs in as `pharmacy` during development and routes straight to `/app/medicine-stock`; adjust the `target` string if you need to land elsewhere while testing but revert before committing.
- Guards (`appAuthGuard`) simply ensure `AuthService.user` is set; if you add a new guard, keep the pattern of redirecting to `/login` and persisting `auth.triedUrl` for post-login navigation.

## Forms & patient data utilities
- Form configs (see `shared/dynamic-forms.interface2.ts`) revolve around a `generalProperties` object with flags such as `isGroup`, `isArray`, `fieldType`, and `controllingField`. `DynamicFormsV2Component.addFieldToForm` recursively builds nested `FormGroup`/`FormArray`s based on those flags—extend `generalProperties` rather than rewriting form logic.
- Dependent visibility is driven by `generalProperties.controllingField[]`: on value changes the component toggles DOM elements marked with `dependency-id`. When adding dependencies, ensure templates set the matching `dependency-id` attribute.
- `shared/patient-data-review` documents how submitted form data is rendered and edited post-submit; reuse its event contracts (`FieldEditEvent`) when wiring new review/approval flows so downstream FHIR transforms continue to work.

## Files & uploads
- Use `UploadUiComponent` for any blob uploads: pass explicit `allowedFiles`, `maxFiles`, and override the Azure SAS inputs instead of editing the default placeholder token committed in the component. The service already exposes `deleteBlob` for cleanup.
- When you persist uploaded files inside forms, capture the emitted metadata (url, blob name, mime type) so patient review screens can link to the actual artifacts.
