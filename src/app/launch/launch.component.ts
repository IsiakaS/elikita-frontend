import { Component } from '@angular/core';
import FHIR from 'fhirclient'
import FhirClient from 'fhirclient/lib/FhirClient';

@Component({
  selector: 'app-launch',
  imports: [],
  templateUrl: './launch.component.html',
  styleUrl: './launch.component.scss'
})
export class LaunchComponent {
  // api://37a3317e-4fb9-4a52-9b17-3a447c7f275a
  ngOnInit(): void {
    // FHIR.oauth2.init()
    // new FHIR.client()
    // USE window.location.origin + '/auth/callback',
    //but force it to start with https
    let origin = window.location.origin;
    if (origin.startsWith("http://")) {
      origin = origin.replace("http://", "https://");
    }

    FHIR.oauth2.authorize({
      clientId: 'aca0e463-0e12-4f03-b353-7f8cc7a39d36',
      scope: 'openid profile fhirUser patient',
      redirectUri: origin + '/auth/callback',
      // noRedirect: true,
      iss: 'https://elikita-server.daalitech.com',
      pkceMode: 'required',



      // iss: "api://elikita2026-fhir-server"
      // pkceMode: 'required'
      // aud: 'api://37a3317e-4fb9-4a52-9b17-3a447c7f275a'
    }).then((client) => {
      // FHIR.oauth2.init()
      console.log('FHIR client authorized:', client);
      client = (client + "").replace("http://", "https://");
      console.log('Redirecting to client URL:', client);
      // window.location.href = client + "";
    }).catch((error) => {
      setTimeout(() => {
        // window.location.reload();
      }, 3000);
      console.error('Error during FHIR client authorization:', error);
    });
  }

}
