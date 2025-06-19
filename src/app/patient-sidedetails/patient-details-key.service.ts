import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientDetailsKeyService {
  patientDetailsStripStatus = new BehaviorSubject(false);
  constructor() { }

  openPatientDetailsStrip() {
    this.patientDetailsStripStatus.next(true)
  }
  closePatientDetailsStrip() {
    this.patientDetailsStripStatus.next(false);
  }
}
