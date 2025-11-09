import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, UrlSegment } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  bbArray: any = [];
  breadCrumbBuild = new BehaviorSubject<{ path: string, pathTitle: string, pathIcon: string }[]>([]);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  routeIcons: any = {
    'dashboard': 'dashboard',
    'patients': 'people',
    'doctors': 'person',
    'appointments': 'event',
    'patient-registration-data': 'person_add',
    'medicine-requests': 'medication',
    'tests-requests': 'science',
    'settings': 'settings',
    'org': 'local_hospital',
    'profile': 'person',
    'org-services': 'work',
  }
  routeTitle: any = {
    'dashboard': 'Dashboard',
    'org': 'Hospital Profile',
    'org-services': 'Available Services',
    'profile': 'Profile',
    'patients': 'Patients',
    'doctors': 'Doctors',
    'appointments': 'Appointments',
    'patient-registration-data': 'Patient Registration',
    'medicine-requests': 'Medicine Requests',
    'tests-requests': 'Tests Requests',
    'settings': 'Settings',
  }
  constructor() {
    this.buildBreadcrumb();
  }




  buildBreadcrumb() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.buildPath(this.activatedRoute.snapshot.root);


      }


    })

  }

  buildPath(route: ActivatedRouteSnapshot | null) {
    if (!route) {
      return;
    }
    let combinedUrlsArray: any[] = [];
    let startRoute = route.root.firstChild;

    while (startRoute) {
      // startRoute = startRoute.firstChild;
      if (startRoute.url.length > 0) {
        let urlSegments: string[] = startRoute.url.map((segment: UrlSegment) => { console.log(segment.parameters); return segment.path });

        combinedUrlsArray.push(...urlSegments);
      }
      startRoute = startRoute.firstChild;
      console.log(startRoute?.url, startRoute);
    }
    combinedUrlsArray = combinedUrlsArray.map((e: any, index: number) => {
      let start = 0;
      let url = "/"
      while (start <= index) {
        url += combinedUrlsArray[start] + "/";
        start++;
      }
      return {
        path: url,
        pathTitle: this.routeTitle[e] || e,
        pathIcon: this.routeIcons[e] || null
      }
    })
    console.log(combinedUrlsArray);
    //  return `/${combinedUrlsArray.join("/")}`;

    this.breadCrumbBuild.next(combinedUrlsArray);
    this.bbArray = combinedUrlsArray;

  }
}
