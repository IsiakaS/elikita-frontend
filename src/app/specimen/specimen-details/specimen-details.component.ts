import { TitleCasePipe } from '@angular/common';
import { Component, inject, Inject, Input, Optional } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Bundle, Specimen } from 'fhir/r5';



import { DetailBaseComponent } from '../../shared/detail-base/detail-base.component';
import { commonImports } from '../../shared/table-interface';
import { LinkInReferencesService } from '../../shared/link-in-references.service';
import { fetchFromReferencePipe } from "../../shared/Fetch.pipe";
import { CodeableReferenceDisplayComponent } from "../../shared/codeable-reference-display/codeable-reference-display.component";
import { SpecialHeaderComponent } from "../../shared/special-header/special-header.component";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { baseStatusStyles } from '../../shared/statusUIIcons';
import { ReferenceDisplayComponent } from "../../shared/reference-display/reference-display.component";
import { DetailsCardzComponent } from '../../details-cardz/details-cardz.component';
import { UtilityService } from '../../shared/utility.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService, capacityObject } from '../../shared/auth/auth.service';
import { EncounterServiceService } from '../../patient-wrapper/encounter-service.service';

@Component({
  selector: 'app-specimen-details',
  imports: [MatCardModule, TitleCasePipe, MatIconModule, MatDividerModule,
    DetailsCardzComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, SpecialHeaderComponent, ReferenceDisplayComponent],
  templateUrl: './specimen-details.component.html',
  styleUrl: './specimen-details.component.scss'
})
export class SpecimenDetailsComponent {
  linkInReferences = inject(LinkInReferencesService)
  realSpecimenDetails?: Specimen & { [key: string]: any };

  @Input() specimenDetailsFromInput?: Specimen;
  detailsBuilderObject;
  statusStyles = baseStatusStyles
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public specimenDetailsFromDialog: any) {
    this.detailsBuilderObject = {
      resourceName: 'specimen',
      resourceIcon: 'biotech',
      specialHeader: {
        specialHeaderKey: 'type',
        specialHeaderIcon: 'medication',
        specialHeaderDataType: 'CodeableConcept',
        ReferenceDeepPath: null, // ['name', '0'].join('$#$');
        valueDeepPath: null,

        baseKeys: [{
          key: 'status',
          keyDataType: 'code',
          keySelectValues: 'available | unavailable | unsatisfactory | entered-in-error'.split(' | '),

        },
        //condition
        {
          key: 'condition',
          keyDataType: 'CodeableConcept',
          keySelectValues: null,
        },
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
              key: 'collection',
              label: 'Collector',
              keyDataType: 'Reference',
              referenceDeepPath: [['name', '0', 'given'].join('$#$'), ['name', '0', 'family'].join('$#$')],
              valueDeepPath: 'collector',
            },
            {
              key: 'request',
              label: 'Request',
              keyDataType: 'Reference',
              referenceDeepPath: [['request', '0', 'identifier', '0', 'value'].join('$#$')],
              valueDeepPath: null,
            }

          ]
        },
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
            {
              key: 'type',
              label: 'Type',
              keyDataType: 'CodeableConcept',
              referenceDeepPath: null,
              valueDeepPath: null,
            },
            //condition
            {
              key: 'condition',
              label: 'Condition',
              keyDataType: 'CodeableConcept',
              referenceDeepPath: null,
              valueDeepPath: null
            },
            {
              key: 'feature',
              label: 'Feature Type',
              keyDataType: 'CodeableConcept',
              referenceDeepPath: null,
              valueDeepPath: 'type',
            },
            {
              key: 'feature',
              label: 'Description',
              keyDataType: 'string',
              referenceDeepPath: null,
              valueDeepPath: 'description',
            },
            {
              key: 'status',
              label: 'Status',
              keyDataType: 'code',
              referenceDeepPath: null,
              valueDeepPath: null,
            }
          ]

        },
        {
          groupName: 'Collection',
          groupIcon: 'date_range',
          groupMembers: [
            {
              key: 'collection',
              label: 'Collected Date/Time',
              keyDataType: 'dateTime',
              referenceDeepPath: null,
              valueDeepPath: 'collectedDateTime',
            },
            {
              key: 'collection',
              label: 'Collection Method',
              keyDataType: 'CodeableConcept',
              referenceDeepPath: null,
              valueDeepPath: 'method',
            },
            {
              key: 'collection',
              label: 'Quantity',
              keyDataType: 'Quantity',
              referenceDeepPath: null,
              valueDeepPath: 'quantity$#$value',
            },
            //unit
            {
              key: 'collection',
              label: 'Quantity Unit',
              keyDataType: 'string',
              referenceDeepPath: null,
              valueDeepPath: 'quantity$#$unit',
            },
            //collection.device
            {
              key: 'collection',
              label: 'Device',
              keyDataType: 'CodeableReference',
              referenceDeepPath: null,
              valueDeepPath: 'device',
            },
            {
              key: 'collection',
              label: 'Body Site',
              keyDataType: 'CodeableReference',
              referenceDeepPath: null,
              valueDeepPath: 'bodySite',
            }

          ]
        }]
    }
  }
  // detailsBuilderObject?
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
    this.realSpecimenDetails = this.specimenDetailsFromDialog.specimenDetails || this.specimenDetailsFromInput

    this.http.get<Bundle<Specimen>>('https://server.fire.ly/r4/Specimen?_format=json').pipe(
      map((response: Bundle<Specimen>): Specimen[] => {
        return response.entry?.map((entry: any) => entry.resource) || [];
      })
    ).subscribe(specimens => {
      this.realSpecimenDetails = specimens[0];
    });
  }

}
