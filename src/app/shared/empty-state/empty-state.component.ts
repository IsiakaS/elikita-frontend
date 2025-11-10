import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable Empty State Component
 * 
 * Usage examples:
 * 
 * Basic usage:
 * <app-empty-state></app-empty-state>
 * 
 * With custom icon:
 * <app-empty-state icon="people_outline" title="No patients found"></app-empty-state>
 * 
 * With predefined constants:
 * <app-empty-state [icon]="EmptyStateComponent.ICONS.PATIENTS" title="No patients"></app-empty-state>
 * 
 * Available icon categories:
 * - Medical: PATIENTS, PATIENT, MEDICAL_SERVICES, HOSPITAL, MEDICATION, APPOINTMENT, ALLERGIES
 * - Data: NO_DATA, EMPTY, SEARCH, FILTER
 * - Actions: ADD, UPLOAD, DOWNLOAD, SYNC
 * - Status: OFFLINE, LOADING, MAINTENANCE, ACCESS_DENIED
 * - Content: NO_RESULTS, NO_CONTENT, NO_FILES, NO_IMAGES
 * - General: INFO, WARNING, ERROR
 */
@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="empty-state g-just-flex flex-column gap-12" style="align-items:center; justify-content:center; padding:32px; text-align:center;">
      <mat-icon class="icon" style="font-size: 48px; height:48px; width:48px; color: var(--mat-sys-primary);">{{ icon }}</mat-icon>
      <div class="title" style="font-size: 1.25rem; font-weight: 600; color: var(--mat-sys-on-surface);">{{ title }}</div>
      <div class="subtitle subtitle-text-color-2" *ngIf="subtitle" style="max-width:640px; color: var(--mat-sys-on-surface-variant);">{{ subtitle }}</div>
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
    @Input() title: string = 'No data available';
    @Input() subtitle?: string;
    @Input() icon: string = 'info';

    // Predefined icon sets for common scenarios
    static readonly ICONS = {
        // General
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        
        // Data related
        NO_DATA: 'database',
        EMPTY: 'folder_open',
        SEARCH: 'search_off',
        FILTER: 'filter_list_off',
        
        // Medical/Healthcare
        PATIENTS: 'people_outline',
        PATIENT: 'person_outline',
        MEDICAL_SERVICES: 'medical_services',
        HOSPITAL: 'local_hospital',
        MEDICATION: 'medication',
        APPOINTMENT: 'event_busy',
        ALLERGIES: 'health_and_safety',
        
        // Actions
        ADD: 'add_circle_outline',
        UPLOAD: 'cloud_upload',
        DOWNLOAD: 'cloud_download',
        SYNC: 'sync_disabled',
        
        // Status
        OFFLINE: 'wifi_off',
        LOADING: 'hourglass_empty',
        MAINTENANCE: 'build_circle',
        ACCESS_DENIED: 'lock_outline',
        
        // Content
        NO_RESULTS: 'search',
        NO_CONTENT: 'description',
        NO_FILES: 'folder_open',
        NO_IMAGES: 'image_not_supported',
    } as const;
}
