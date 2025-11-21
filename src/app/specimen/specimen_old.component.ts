import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { Bundle } from 'fhir/r4';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { MatDialog } from '@angular/material/dialog';
import { AddSpecimenComponent } from './add-specimen/add-specimen.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { FhirResourceTransformService } from '../shared/fhir-resource-transform.service';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { ErrorService } from '../shared/error.service';
import { AuthService } from '../shared/auth/auth.service';
import { StateService } from '../shared/state.service';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';

@Component({
  selector: 'app-specimen',
  imports: [TabledOptionComponent],
  templateUrl: './specimen_old.component.html',
  styleUrl: './specimen.component.scss'
})
export class SpecimenComponent {
  http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private fhirTransformService = inject(FhirResourceTransformService);
  private fhirResourceService = inject(FhirResourceService);
  private errorService = inject(ErrorService);
  private stateService = inject(StateService);
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['subject', {
      dataType: "IndividualReferenceField",
      columnName: "Patient"
    }],
    ['medication', {
      dataType: "CodeableReferenceField",
      displayStyle: "chips",
      columnName: "Allergy Type"
    }],
    ['status', {
      dataType: "SingleCodeField",
      displayStyle: "chips",
      columnName: "Status"
    }],


    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['subject', 'medication', 'status',],
  }
  detailsBuilder: DetailsBuilderObject = {
    resourceName: 'Specimen',
    resourceIcon: 'science',
    specialHeader: {
      strongSectionKey: 'type',
      iconSectionKeys: ['status'],
      contentSectionKeys: ['subject', 'receivedTime']
    },
    groups: [
      { groupName: 'Identification', groupIcon: 'fingerprint', groupKeys: ['type', 'status', 'request'] },
      { groupName: 'Collection', groupIcon: 'precision_manufacturing', groupKeys: ['collection', 'bodySite'] },
      { groupName: 'Condition', groupIcon: 'health_and_safety', groupKeys: ['condition', 'note'] }
    ]
  };
  ngOnInit() {
    this.http.get("https://server.fire.ly/r4/MedicationRequest?_format=json").subscribe((e: any) => {
      this.testingTabeledOption.rawTableData = e;

    })
  }

  onAddSpecimen(patientId?: string, serviceRequestId?: string) {
    const dialogRef = this.dialog.open(AddSpecimenComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      autoFocus: false,
      data: { patientId, serviceRequestId }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !result.values || (Array.isArray(result.values) && result.values.length === 0)) {
        this.errorService.openandCloseError('No Specimen was created as the form was closed without submission.');
        return;
      }

      let values = result.values;
      if (!Array.isArray(values)) {
        values = [values];
      }

      const practitionerId = this.authService.user.getValue()?.['userId'];
      const practitionerRef = practitionerId ? `Practitioner/${practitionerId}` : null;

      const specimenResources = values.map((val: any) => {
        const resource: any = {
          ...this.fhirTransformService.transformValues('Specimen', val),
          resourceType: 'Specimen'
        };
        if (practitionerRef) {
          resource.collection = {
            ...(resource.collection || {}),
            collector: { reference: practitionerRef }
          };
        }
        return resource;
      });

      const bundle: Bundle<any> = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: specimenResources.map((resource: any) => ({
          resource,
          request: { method: 'POST', url: 'Specimen' }
        }))
      };

      this.fhirResourceService.postBundle(bundle).subscribe({
        next: (response) => {
          const persistedResources =
            response?.bundle?.entry?.map((entry: any) => entry.resource).filter(Boolean) ?? specimenResources;

          persistedResources.forEach((resource: any) => {
            this.stateService.persistOrgWideResource(resource, 'saved');
            if (patientId) {
              this.stateService.persistPatientResource(resource, 'saved');
            }
          });

          this.snackBar.openFromComponent(SuccessMessageComponent, {
            data: { message: 'Specimen record(s) created successfully.' },
            duration: 3000
          });
        },
        error: () => {
          this.errorService.openandCloseError('Error creating specimen record(s). Please try again later.');
        }
      });
    });
  }

  showRow(specimen: any) {
    this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '90vh',
      data: {
        resourceData: specimen,
        detailsBuilderObject: this.detailsBuilder
      }
    });
  }
}
