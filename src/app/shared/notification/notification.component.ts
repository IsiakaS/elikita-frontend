import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgClass } from '@angular/common';
import { NotificationService } from './notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [AsyncPipe, NgFor, NgClass],
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'app-notifications' },
})
export class NotificationComponent {
    ns = inject(NotificationService);
    notes$ = this.ns.notifications$;
    constructor() { }
    track(_index: number, n: any) { return n.id; }
    close(id: number) { this.ns.remove(id); }
}
