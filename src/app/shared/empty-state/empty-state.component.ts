import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
}
