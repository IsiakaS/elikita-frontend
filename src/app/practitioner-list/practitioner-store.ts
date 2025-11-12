import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Bundle, Patient } from 'fhir/r4';
import { Practitioner } from 'fhir/r4';

@Injectable()
export class PractitionerRegistrationCenterStore {
    practitioners$ = new BehaviorSubject<Practitioner[]>([]);

    setFromBundle(bundle: Bundle | null | undefined) {
        const entries = bundle?.entry ?? [];
        const pats = entries.map(e => e.resource as Practitioner);
        this.practitioners$.next(pats);
    }

    updatePractitioner(updated: Practitioner) {
        const curr = this.practitioners$.value.slice();
        const idx = curr.findIndex(p => p.id === updated.id);
        if (idx >= 0) {
            curr[idx] = { ...curr[idx], ...updated } as Practitioner;
            this.practitioners$.next(curr);
        }
    }

    removePractitioner(id: string) {
        const next = this.practitioners$.value.filter(p => p.id !== id);
        this.practitioners$.next(next);
    }
}
