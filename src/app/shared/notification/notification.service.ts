import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    autoClose?: number; // ms
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private seq = 0;
    private store = new BehaviorSubject<AppNotification[]>([]);
    notifications$ = this.store.asObservable();

    private update(list: AppNotification[]) {
        this.store.next(list);
    }

    push(message: string, type: AppNotification['type'] = 'info', autoClose = 4000) {
        const note: AppNotification = { id: ++this.seq, message, type, autoClose };
        const list = [...this.store.value, note];
        this.update(list);
        if (autoClose && autoClose > 0) {
            setTimeout(() => this.remove(note.id), autoClose);
        }
        return note.id;
    }

    success(msg: string, autoClose?: number) { return this.push(msg, 'success', autoClose ?? 3000); }
    error(msg: string, autoClose?: number) { return this.push(msg, 'error', autoClose ?? 6000); }
    info(msg: string, autoClose?: number) { return this.push(msg, 'info', autoClose ?? 4000); }
    warning(msg: string, autoClose?: number) { return this.push(msg, 'warning', autoClose ?? 5000); }

    remove(id: number) {
        this.update(this.store.value.filter(n => n.id !== id));
    }

    clear() { this.update([]); }
}
