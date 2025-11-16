import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InfoDialogComponent, InfoDialogData } from './info-dialog.component';

@Injectable({ providedIn: 'root' })
export class InfoDialogService {
    constructor(private dialog: MatDialog) { }

    show(message: string, opts?: { title?: string; duration?: number; width?: string; panelClass?: string | string[] }) {
        const ref: MatDialogRef<InfoDialogComponent, unknown> = this.dialog.open(InfoDialogComponent, {
            width: opts?.width ?? '420px',
            panelClass: opts?.panelClass,
            data: { title: opts?.title, message } as InfoDialogData
        });

        const ms = opts?.duration ?? 4000;
        if (ms && ms > 0) {
            const timer = setTimeout(() => ref.close(), ms);
            ref.afterClosed().subscribe(() => clearTimeout(timer));
        }
        return ref;
    }

    info(message: string, duration?: number) {
        return this.show(message, { title: 'Info', duration });
    }
}
