import { JsonPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Inject, Input, Optional, resource } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Bundle, Organization, Specimen } from 'fhir/r5';


// hi, copilot remove the first ../ fro the below link
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { commonImports } from '../shared/table-interface';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
import { SpecialHeaderComponent } from "../shared/special-header/special-header.component";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ReferenceDisplayComponent } from "../shared/reference-display/reference-display.component";
import { DetailsCardzComponent } from '../details-cardz/details-cardz.component';
import { UtilityService } from '../shared/utility.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { HospitalService } from './hospital.service';


@Component({
  selector: 'app-hospital-details',
  imports: [MatCardModule,
    JsonPipe,
    TitleCasePipe, MatIconModule, MatDividerModule,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],

  templateUrl: './hospital-details.component.html',
  styleUrl: './hospital-details.component.scss'
})
export class HospitalDetailsComponent {
  linkInReferences = inject(LinkInReferencesService)
  realHospitalDetails?: Organization & { [key: string]: any };
  @Input() hospitalDetailsFromInput?: Bundle;
  detailsBuilderObject;
  statusStyles = baseStatusStyles
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public hospitalDetailsFromDialog: any
  ) {
    this.detailsBuilderObject = {
      resourceName: 'Hospital',
      resourceIcon: 'local_hospital',
      specialHeader: {
        specialHeaderKey: 'name',
        specialHeaderIcon: 'local_hospital',
        specialHeaderDataType: 'string',
        ReferenceDeepPath: null, // ['name', '0'].join('$#$');
        valueDeepPath: null,

      },
      //check fhir 5 serviceRequest Resource and give me appropriate builderOject properties
      groups: [{
        groupName: 'Contact',
        groupIcon: 'contact_phone',
        groupMembers: [

          {
            key: 'contact',
            label: 'Address Summary',
            keyDataType: 'string',
            referenceDeepPath: null,// [['0', 'address', '0', 'text'].join('$
            valueDeepPath: [['0', 'address', 'text'].join('$#$')],
          },
          {
            key: 'contact',
            label: 'Street Address',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: [['0', 'address', 'line'].join('$#$')],
          },
          {
            key: 'contact',
            label: 'City',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: [['0', 'address', 'city'].join('$#$')],
          },
          {
            key: 'contact',
            label: 'State',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: [['0', 'address', 'state'].join('$#$')],
          },
          {
            key: 'contact',
            label: 'Postal Code',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: [['0', 'address', 'postalCode'].join('$#$')],
          },
          {
            key: 'contact',
            label: 'Country',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: [['0', 'address', 'country'].join('$#$')],

          }
        ]
      },
      //group for desc, tyoe and qualification.code - codeableconcept
      {
        groupName: 'Details',
        groupIcon: 'info',
        groupMembers: [
          {
            key: 'id',
            label: 'ID',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: null,
          },
          //name
          {
            key: 'name',
            label: 'Name',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: null,
          },
          //alias
          {
            key: 'alias',
            label: 'Alias',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: ['0'].join('$#$'),
          },
          {
            key: 'telecom',
            label: 'Contact Number',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: ['0', 'telecom', '0', 'value'].join('$#$'),
          },
          {
            key: 'telecom',
            label: 'Email',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: ['0', 'telecom', '1', 'value'].join('$#$'),

          },
          {
            key: 'type',
            label: 'Type',
            keyDataType: 'CodeableConcept',
            referenceDeepPath: null,
            valueDeepPath: [0]
          },
          {
            key: 'description',
            label: 'Description',
            keyDataType: 'string',
            referenceDeepPath: null,
            valueDeepPath: null,
          },
          {
            key: 'qualification',
            label: 'Qualification Code',
            keyDataType: 'CodeableConcept',
            referenceDeepPath: null,
            valueDeepPath: ['0', 'code'].join('$#$'),
          }
        ]
      }
      ]


    };
  }

  http = inject(HttpClient);
  patientId: string | null = null;
  utilityService = inject(UtilityService)
  route = inject(ActivatedRoute);
  auth = inject(AuthService);
  user: any = null;
  encounterService = inject(EncounterServiceService);
  capacityObject = capacityObject;
  ngOnInit() {
    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['labRequest']['request'].push('testing');

      }
    })

    let hosDetails;
    //this.http.get<Bundle<Organization>>('https://server.fire.ly/r4/Organization?_format=json')
    this.http.get<Bundle<Organization>>('/orgBundle.json')
      .subscribe((e: Bundle<Organization>) => {
        hosDetails = e.entry?.[1].resource;
        this.realHospitalDetails = hosDetails || this.hospitalDetailsFromInput || this.hospitalDetailsFromDialog || hosDetails;
        console.log(this.realHospitalDetails);
        for (const contact of (this.realHospitalDetails as Organization)?.contact ?? []) {
          let c = contact;
          console.log(c);
          if (c?.telecom && c?.telecom.length > 0) {
            c.telecom.forEach((telecom, index) => {
              const lastIndexForType = this.detailsBuilderObject.groups[0].groupMembers.filter(member => member.key === `${telecom.system}`).length;
              (this.detailsBuilderObject.groups[0].groupMembers as any[]).push({
                key: `contact`,
                label: `${telecom.system}_${lastIndexForType + 1}`,
                keyDataType: 'string',
                valueDeepPath: ['0', 'telecom', `${index}`, 'value'].join('$#$'),
                referenceDeepPath: null,
              });
            })
          }





          console.log(this.detailsBuilderObject)
        }
      });

  }
  hosServ = inject(HospitalService);
}
