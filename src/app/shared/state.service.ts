import { Injectable } from '@angular/core';
import { Encounter } from 'fhir/r4';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor() { }

  currentEncounter: Observable<null | {
    status: 'new' | 'in-progress' | 'completed',
    [key: string]: any
  }> = new BehaviorSubject(null);

  private encounterChecklistCompleted = new BehaviorSubject<boolean>(false);
  encounterChecklistCompleted$ = this.encounterChecklistCompleted.asObservable();

  setCurrentEncounter(encounter: null | {
    status: Encounter['status'],
    [key: string]: any
  }) {
    (this.currentEncounter as BehaviorSubject<null | {
      status: Encounter['status'],
      [key: string]: any
    }>).next(encounter);


  }

  currentHospital: Observable<{
    id: string,
    name: string,
    [key: string]: any
  }> = new BehaviorSubject({
    id: '1234567890',
    name: 'e-Likita General Hospital'
  })

  setCurrentHospital(hospital: {
    id: string,
    name: string,
    [key: string]: any
  }) {
    (this.currentHospital as BehaviorSubject<{
      id: string,
      name: string,
      [key: string]: any
    }>).next(hospital);
  }

  setEncounterChecklistCompleted(completed: boolean) {
    this.encounterChecklistCompleted.next(completed);
  }

  resetEncounterChecklist() {
    this.encounterChecklistCompleted.next(false);
  }

}
