import { Component, inject } from '@angular/core';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from "@angular/router"
import { ErrorService } from '../shared/error.service';
import { AuthService } from '../shared/auth/auth.service';
//import { getAuth, signInWithPopup, FacebookAuthProvider } from "firebase/auth";
//import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatInputModule, MatIconModule, MatFormField, MatExpansionModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  fb = inject(FormBuilder);
  errorService = inject(ErrorService);
  auth = inject(AuthService)
  showPassword: boolean = false
  registerForm: FormGroup
  constructor() {
    this.registerForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  submitForm() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value)
      // if (this.registerForm.value.email && (this.registerForm.value.password == 'doctor123'
      //   ||
      //   this.registerForm.value.password == 'patient123'
      //   ||
      //   this.registerForm.value.password == 'lab123')) {
      this.auth.login(this.registerForm.value.email, this.registerForm.value.password);
      // this.router.navigate(['/login']);
      //}
    } else {
      this.errorService.openandCloseError("Please enter a valid email and password");
    }
  }

  signInWithGoogle() {

  }
  resetForgotPassword() {

  }
}



