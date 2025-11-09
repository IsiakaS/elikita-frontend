import { Component, inject } from '@angular/core';
import { PatientRegistrationDetailsComponent } from '../patient-registration-details/patient-registration-details.component';
import { HttpClient } from '@angular/common/http';
import { Bundle, Patient, Resource } from 'fhir/r5';

@Component({
  selector: 'app-profile',
  imports: [PatientRegistrationDetailsComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  profileData?: any;

  http = inject(HttpClient);
  ngOnInit() {
    this.http.get<Bundle>('https://server.fire.ly/r5/Patient?_format=json&_count=10').subscribe({
      next: (allData: any) => {
        this.profileData = allData.entry?.map((e: any) => {
          return e.resource;
        })[0] || [];

        console.log(this.profileData);
      },
      error: (e: any) => {

      }
    })
  }

}
