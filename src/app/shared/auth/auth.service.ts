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
    if (username.includes('doctor123') && password.includes('doctor123')) {
      this.user.next({ name: 'Dr. John Doe', role: 'doctor', id: 123 });
      this.triedUrl = this.triedUrl ?? '/app';
      this.router.navigate([this.triedUrl])
    } else if (username.includes('patient123') && password.includes('patient123')) {
      this.user.next({ name: 'John Doe', role: 'patient', id: 123 });
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
}
