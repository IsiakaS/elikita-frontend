import { JsonPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Inject, Input, Optional, resource } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Bundle, Specimen } from 'fhir/r5';


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


@Component({
  selector: 'app-labrequest-details',
  imports: [MatCardModule,
    JsonPipe,
    TitleCasePipe, MatIconModule, MatDividerModule,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
  templateUrl: './labrequest-details.component.html',
  styleUrl: './labrequest-details.component.scss'
})
export class LabrequestDetailsComponent {
  linkInReferences = inject(LinkInReferencesService)
  realLabRequestDetails?: Bundle & { [key: string]: any };

  @Input() labRequestDetailsFromInput?: Bundle;
  detailsBuilderObject;
  statusStyles = baseStatusStyles
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public labRequestDetailsFromDialog: any) {
    this.detailsBuilderObject = {
      //check fhir 5 serviceRequest Resource and give me appropriate builderOject properties
      resourceName: 'Service Request (Lab Tests Order)',
      resourceIcon: 'biotech',
      specialHeader: {
        specialHeaderKey: 'code',
        specialHeaderIcon: 'biotech',
        specialHeaderDataType: 'CodeableReference',
        ReferenceDeepPath: null, // ['name', '0'].join('$#$');
        valueDeepPath: null,

        baseKeys: [{
          key: 'status',
          keyDataType: 'code',
          keySelectValues: 'draft | active | on-hold | revoked | completed | entered-in-error | unknown'.split(' | '),

        },
        //condition
        {
          key: 'intent',
          keyDataType: 'code',
          keySelectValues: 'proposal | plan | directive | order | original-order | reflex-order | filler-order | instance-order | option'.split(' | ')
        },
        {
          key: 'priority',
          keyDataType: 'code',
          keySelectValues: 'routine | urgent | asap | stat'.split(' | ')
        }
        ]
      },
      groups: [
        {
          groupName: 'Actors',
          groupIcon: 'people',
          groupMembers: [
            {
              key: 'subject',
              label: 'Patient',
              keyDataType: 'Reference',
              referenceDeepPath: [['name', '0', 'given'].join('$#$'), ['name', '0', 'family'].join('$#$')],
              valueDeepPath: null,
            },
            {
              key: 'requester',
              label: 'Requester',
              keyDataType: 'Reference',
              referenceDeepPath: [['name', '0', 'given'].join('$#$'), ['name', '0', 'family'].join('$#$')],
              valueDeepPath: null,
            },
            {
              key: 'performer',
              label: 'Performer',
              keyDataType: 'Reference',
              referenceDeepPath: [['name', '0', 'given'].join('$#$'), ['name', '0', 'family'].join('$#$')],
              valueDeepPath: null,
            },
            //performerType is not a reference, it is a CodeableConcept
            {
              key: 'performerType',
              label: 'Performer Type',
              keyDataType: 'CodeableConcept',
              referenceDeepPath: null,
              valueDeepPath: [['coding', '0', 'code'].join('$#$'), ['coding', '0', 'display'].join('$#$')],
            }

          ]
        },
        {
          groupName: 'Request Details',
          groupIcon: 'info',
          groupMembers: [
            {
              key: 'id',
              label: 'ID',
              keyDataType: 'string',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            {
              key: 'code',
              label: 'Service Requested',
              keyDataType: 'CodeableReference',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            {
              key: 'status',
              label: 'Status',
              keyDataType: 'code',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            {
              key: 'intent',
              label: 'Intent of the Request',
              keyDataType: 'code',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            {
              key: 'priority',
              label: 'Priority of the Request',
              keyDataType: 'code',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            //reason
            {
              key: 'reason',
              label: 'Reason for the Request',
              keyDataType: 'CodeableReference',
              referenceDeepPath: null,
              valueDeepPath: null,
            }

          ]
        },
        //technical details - bodySute, specimen E.T.C
        {
          groupName: 'Technical Details',
          groupIcon: 'build',
          groupMembers: [
            {
              key: 'bodySite',
              label: 'Body Site',
              keyDataType: 'CodeableReference',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            {
              key: 'specimen',
              label: 'Specimen',
              keyDataType: 'Reference',
              referenceDeepPath: [['type', 'coding', '0', 'display'].join('$#$')],
              valueDeepPath: null,
            }
          ]
        }
      ]

    }



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
    this.patientId = this.route.parent?.snapshot.params['id'] || this.utilityService.getPatientIdFromRoute();
    this.realLabRequestDetails = this.labRequestDetailsFromInput || this.labRequestDetailsFromDialog.serviceRequest;

  }
}

