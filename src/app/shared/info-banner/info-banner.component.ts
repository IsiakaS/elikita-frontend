import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';

type InfoType = 'info' | 'success' | 'warning' | 'error' | 'tip';
export interface InfoAction { id?: string; label: string; }

@Component({
    selector: 'app-info-banner',
    standalone: true,
    imports: [NgIf, NgFor, NgClass],
    templateUrl: './info-banner.component.html',
    styleUrls: ['./info-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'app-info-banner' }
})
export class InfoBannerComponent {
    @Input() type: InfoType = 'info';
    @Input() title?: string;
    @Input() dismissible = false;
    @Input() icon: string | null = null; // null = hide icon, string = custom text/icon, undefined = default icon
    @Input() actions: InfoAction[] = [];

    @Output() closed = new EventEmitter<void>();
    @Output() action = new EventEmitter<string>(); // emits action id or label

    get ariaRole() { return this.type === 'error' || this.type === 'warning' ? 'alert' : 'status'; }

    onClose() { this.closed.emit(); }
    onAction(a: InfoAction) { this.action.emit(a.id ?? a.label); }
    trackAction(_: number, a: InfoAction) { return a.id ?? a.label; }
}
