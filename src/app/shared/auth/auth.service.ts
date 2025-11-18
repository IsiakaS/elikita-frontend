// Navigation links for sidebar/menu
export const appLinks = [
  {
    label: 'Practitioners',
    path: '/practitioners',
    icon: 'badge',
    roles: ['admin', 'receptionist']
  },
  // ...add other links as needed
];
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment, UrlTree } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ErrorService } from '../error.service';

export interface User {
  role: string;
  [key: string]: any
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  triedUrl!: string | null;
  router = inject(Router);
  errorService = inject(ErrorService);
  user: BehaviorSubject<null | User> = new BehaviorSubject<null | User>(null);
  constructor() {
    this.user.subscribe((user) => {
      // if (!user) {
      //   this.triedUrl = this.route.snapshot.url.toString()
      //   alert(this.triedUrl);
      //   this.router.navigate(['/login']);
      // }
    })
  }
  route = inject(ActivatedRoute);
  login(username: string, password: string) {
    // alert(username + ' ' + password);
    if (username.includes('doctor123') && password.includes('doctor123')) {
      this.user.next({ name: 'Dr. John Doe', role: 'doctor', id: 123 });
      this.triedUrl = this.triedUrl ?? '/app';
      this.router.navigate([this.triedUrl])
    } else if (username.includes('lab123') && password.includes('lab123')) {
      this.user.next({ name: 'Tech. John Doe', role: 'lab', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl])
    } else if (username.includes('nurse123') && password.includes('nurse123')) {
      this.user.next({ name: 'Nurse. John Doe', role: 'nurse', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl])
    } else if ((username.includes('admin123') && password.includes('admin123'))) {
      this.user.next({ name: 'Admin John Doe', role: 'admin', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl])

    } else if ((username.includes('patient123') && password.includes('patient123'))) {
      // alert('ddd')

      this.user.next({ name: 'Patient. John Doe', role: 'patient', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app/patients/100001/';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl])

    } else if ((username.includes('pharmacy123') && password.includes('pharmacy123'))) {
      this.user.next({ name: 'Pharmacy. John Doe', role: 'pharmacy', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl])
    }
    //cashier
    else if (username.includes('cashier123') && password.includes('cashier123')) {
      this.user.next({ name: 'Cashier John Doe', role: 'cashier', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl]);

    }
    //receptionist
    else if (username.includes('receptionist123') && password.includes('receptionist123')) {
      this.user.next({ name: 'Receptionist John Doe', role: 'receptionist', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl]);

    }

    else if (username.includes('cashier123') && password.includes('cashier123')) {
      this.user.next({ name: 'Cashier John Doe', role: 'cashier', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl]);

    }

    //consultant
    else if (username.includes('consultant123') &&
      password.includes("consultant123")
    ) {
      this.user.next({ name: 'Consultant John Doe', role: 'consultant', id: 123 });
      console.log(this.user.getValue());
      this.triedUrl = this.triedUrl ?? '/app';
      console.log(this.triedUrl);
      this.router.navigate([this.triedUrl]);

    }


    else {
      this.errorService.openandCloseError("Email or password is incorrect");
      this.user.next(null);
    }

  }
  logout() {
    this.user.next(null);
    this.router.navigate(['/login']);

  }
  refreshL(username: string, password: string) {
    // this.user.next(null);
    // this.router.navigate(['/login']);
    this.login(username, password);

    this.router.navigateByUrl(this.triedUrl ?? '/app', { skipLocationChange: true }).then(() => {
      this.router.navigate([this.router.url]);
    });
  }

  // Authorization helper based on capacityObject map
  can(resource: keyof typeof capacityObject, action: string): boolean {
    const u = this.user.getValue();
    if (!u) return false;
    const resourceCaps = (capacityObject as any)[resource];
    if (!resourceCaps) return false;
    const allowedRoles: string[] | undefined = resourceCaps[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(u.role);
  }

  canAddPatient(): boolean {
    return this.can('patient', 'add');
  }

}

// ehr module with verbs-actions and users who can do them
// this is used to determine if a user can perform an action on a resource
export const capacityObject = {
  patient: {
    'add': ['admin', 'receptionist'],
    'register': ['admin', 'receptionist', 'doctor', 'nurse', 'lab', 'pharmacy', 'patient'],
    'viewAll': ['admin', 'receptionist', 'doctor', 'nurse', 'lab', 'pharmacy'],
    'viewSelf': ['patient', 'doctor', 'nurse', 'lab', 'pharmacy', 'admin', 'receptionist'],
    'update': ['admin', 'receptionist'],
    'delete': ['admin', 'receptionist'],

  },
  practitioner: {

  },
  medication: {
    'stock': ['admin', 'pharmacy'],
    'add': ['admin', 'pharmacy'],
    'viewAll': ['admin', 'pharmacy'],
    'viewSelf': ['admin', 'pharmacy'],
    'update': ['admin', 'pharmacy'],
  },
  appointment: {
    'book': ['admin', 'receptionist', 'doctor', 'nurse', 'lab', 'pharmacy', 'patient'],
    'viewAll': ['admin', 'receptionist'],
    'viewSelf': ['patient', 'doctor', 'nurse', 'lab', 'pharmacy', 'admin', 'receptionist'],
    'updateSelf': ['patient', 'doctor', 'nurse', 'lab', 'pharmacy', 'admin', 'receptionist'],
    'updateAll': ['admin', 'receptionist'],
    'delete': ['admin', 'receptionist'],
    'assign': ['admin', 'receptionist'],

  },
  // medication is the drug itself, not the request , the pharmacy is in charge of adding and updating the medication
  //but the doctor and nurse can view the available drugs/medication
  medicationRequest: {
    request: ['doctor'],
    revoke: ['doctor'],

    viewAll: ['admin', 'receptionist', 'doctor', 'nurse', 'lab', 'pharmacy', 'patient', 'cashier'],
    viewSelf: ['patient', 'doctor', 'nurse', 'lab', 'pharmacy', 'admin', 'receptionist'],
    update: ['doctor'],
    delete: ['doctor'],
    dispense: ['pharmacy'],
    administer: ['nurse', 'doctor'],
    viewDispensed: ['pharmacy', 'doctor', 'nurse'],

  },
  specimen: {
    'add': ['lab'],
    'edit': ['lab'],
    'viewAll': ['lab', 'doctor'],
    'viewSelf': ['patient', 'lab', 'doctor'],
  },
  labRequest: {
    request: ['doctor'],
    enter_result: ['lab',],
    diagnosticReport: ['lab', 'doctor'],
    view_specimen: ['lab', 'doctor', 'patient'],
    revoke: ['doctor'],
    viewAll: ['doctor', 'lab'],
    viewSelf: ['patient'],
    order: ['lab', 'doctor', 'cashier'],
  },
  diagnosticReport: {
    request: ['doctor'],
    add: ['lab', 'doctor'],
    update: ['lab', 'doctor'],
    viewAll: ['doctor', 'lab'],
    viewSelf: ['patient']
  },

  // NEW: Observation resource standard permissions
  observation: {
    add: ['doctor', 'nurse', 'lab'],
    viewAll: ['admin', 'doctor', 'nurse', 'lab', 'pharmacy'],
    viewSelf: ['patient', 'doctor', 'nurse', 'lab', 'admin', 'receptionist'],
    update: ['doctor', 'nurse', 'lab'],
    delete: ['admin'],
    changeStatus: ['doctor', 'nurse', 'lab'], // e.g., preliminary -> final, cancel, entered-in-error
    enterResult: ['lab'] // lab technologists entering measured values
  },
  condition: {
    add: ['doctor', 'nurse'],
    viewAll: ['admin', 'doctor', 'nurse', 'lab', 'pharmacy'],
    viewSelf: ['patient', 'doctor', 'nurse', 'lab', 'admin', 'receptionist'],
    update: ['doctor', 'nurse'],
    delete: ['admin'],
    export: ['admin', 'doctor', 'nurse', 'lab', 'pharmacy']
  }
}




