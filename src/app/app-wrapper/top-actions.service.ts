import { ElementRef, Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TopActionsService {

  constructor() { }

  topactiontemplate = new BehaviorSubject<null | TemplateRef<any>>(null);
  insertTopAction(template: TemplateRef<any>) {
    console.log(template);
    this.topactiontemplate.next(template);

  }
  removeTopAction() {
    this.topactiontemplate.next(null);
  }
}
