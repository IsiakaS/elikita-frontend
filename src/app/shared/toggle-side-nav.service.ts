import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToggleSideNavService {

  constructor() { }
  sideNavClosed = new BehaviorSubject(false);
  sideNavCollapsed = new BehaviorSubject(false);


  openSideNav() {
    this.sideNavClosed.next(false);
  }
  closeSideNav() {
    this.sideNavClosed.next(true);
  }
  collapseSideNav() {

    this.sideNavCollapsed.next(true);
    //alert(this.sideNavCollapsed.getValue());

  }
  expandSideNav() {
    this.sideNavCollapsed.next(false);
  }
}
