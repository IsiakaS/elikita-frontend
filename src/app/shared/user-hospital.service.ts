import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserHospitalService {
    private readonly storageKey = 'user_hospital';
    private _hospital: any = null;

    get hospital() {
        if (this._hospital) return this._hospital;
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this._hospital = JSON.parse(stored);
            return this._hospital;
        }
        return null;
    }

    set hospital(hospital: any) {
        this._hospital = hospital;
        localStorage.setItem(this.storageKey, JSON.stringify(hospital));
    }

    clear() {
        this._hospital = null;
        localStorage.removeItem(this.storageKey);
    }
}
