import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecordHolderService {
  _currentPatientData = new BehaviorSubject("");
  constructor() { }

  setPatientData(patientData: any) {
    //to later go to backend to fetch
    this._currentPatientData.next(patientData);

  }
  getPatientData(): Observable<any> {
    return this._currentPatientData;
  }
}
