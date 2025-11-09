import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AichatService {

  constructor() { }

  openAndC = new BehaviorSubject(false);

  openAI() {
    this.openAndC.next(true);
  }
  closeAI() {
    this.openAndC.next(false)
  }
}
