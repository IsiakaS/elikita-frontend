import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Bundle, Patient } from 'fhir/r4';

@Injectable()
export class PatientRegistrationCenterStore {
    patients$ = new BehaviorSubject<Patient[]>([]);

    setFromBundle(bundle: Bundle | null | undefined) {
        const entries = bundle?.entry ?? [];
        const pats = entries.map(e => e.resource as Patient);
        this.patients$.next(pats);
    }

    updatePatient(updated: Patient) {
        const curr = this.patients$.value.slice();
        const idx = curr.findIndex(p => p.id === updated.id);
        if (idx >= 0) {
            curr[idx] = { ...curr[idx], ...updated } as Patient;
            this.patients$.next(curr);
        }
    }

    removePatient(id: string) {
        const next = this.patients$.value.filter(p => p.id !== id);
        this.patients$.next(next);
    }
}
