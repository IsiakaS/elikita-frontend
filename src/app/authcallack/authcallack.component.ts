import { Component, inject } from '@angular/core';
import Fhir from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { SecureFhirClientService } from '../launch/secure-fhir-client.service';

@Component({
  selector: 'app-authcallack',
  imports: [],
  templateUrl: './authcallack.component.html',
  styleUrl: './authcallack.component.scss'
})
export class AuthcallackComponent {
  user: any = null;

  ngOnInit() {
    Fhir.oauth2.ready({

    }).then((client: Client) => {
      console.log(client);
      client.create({
        resourceType: 'Patient',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1980-01-01'
      }).then((metadata) => {
        console.log('Fetched metadata:', metadata);
      });
      let user = client.getFhirUser();

      console.log('FHIR User:', user);
      if (user) {
        // i wanna know the user details - if it's practitioner go to prac
        // if it's patient - go to patient ;
        let userType = user.split("/")[0];
        let userId = user.split("/")[1];
        client.request(`/${userType}/${userId}`).then((userDetails) => {
          this.user = userDetails;
        });
      }
    })
  }


}
