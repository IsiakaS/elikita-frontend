import { Component, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Bundle, Specimen } from 'fhir/r4';
import { HttpClient } from '@angular/common/http';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { StateService } from '../shared/state.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ErrorService } from '../shared/error.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { JsonPipe } from '@angular/common';
import { References2Pipe } from '../shared/references2.pipe';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';
import { ChipsDirective } from '../chips.directive';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { NaPipe } from '../shared/na.pipe';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AddSpecimenComponent } from '../specimen/add-specimen/add-specimen.component';
import { SpecimenDetailsComponent } from '../specimen/specimen-details/specimen-details.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FhirResourceTransformService } from '../shared/fhir-resource-transform.service';
import { FhirResourceService } from '../shared/fhir-resource.service';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { Router } from '@angular/router';
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';


@Component({
  selector: 'app-specimens',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    CommonModule,
    DatePipe,
    TitleCasePipe,
    JsonPipe,
    References2Pipe,
    CodeableConcept2Pipe,
    fetchFromReferencePipe,
    ChipsDirective,
    ReferenceDisplayDirective,
    NaPipe,
    EmptyStateComponent
  ],
  templateUrl: './specimens.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './specimens.component.scss']
})
export class SpecimensComponent {
  private auth = inject(AuthService);
  encounterService = inject(EncounterServiceService);
  private stateService = inject(StateService);
  private errorService = inject(ErrorService);
  private router = inject(Router);
  dialog = inject(MatDialog);
  statusStyles = baseStatusStyles;

  canAddSpecimen$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('specimen', 'add')));
  canExportSpecimen$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('specimen', 'viewAll')));

  tableDataSource = new MatTableDataSource<Specimen>();
  tableDataLevel2 = new BehaviorSubject<Specimen[]>([]);
  specimenDisplayedColumns: string[] = ['receivedTime', 'status', 'type', 'subject', 'request', 'action'];

  patientId: string | null = null;
  private useOrgWideSpecimens = false;

  constructor() {
    this.tableDataSource.connect = () => this.tableDataLevel2;
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
      { groupName: 'Collection', groupIcon: 'precision_manufacturing', groupKeys: ['collection.collector', 'bodySite', 'subject'] },
      { groupName: 'Condition', groupIcon: 'health_and_safety', groupKeys: ['condition', 'note'] }
    ]
  };
  ngOnInit(): void {
    const resolvedPatientId = this.stateService.currentPatientIdFromResolver.getValue();
    const encounterPatientId = this.stateService.currentEncounter.getValue()?.patientId ?? null;
    const canViewAllSpecimens = this.auth.can('specimen', 'viewAll');

    if (!resolvedPatientId && !encounterPatientId) {
      if (!canViewAllSpecimens) {
        this.errorService.openandCloseError('No patient selected. Please pick a patient to view specimens.');
        this.router.navigate(['/app/patients']);
        return;
      }
      this.useOrgWideSpecimens = true;
      this.patientId = null;
    } else {
      this.patientId = resolvedPatientId ?? encounterPatientId;
    }

    const specimensSource = this.useOrgWideSpecimens
      ? this.stateService.orgWideResources.specimens
      : this.stateService.PatientResources.specimens;

    specimensSource.subscribe((allData: any[]) => {
      const specimens = (allData || [])
        .map((entry: any) => entry.actualResource as Specimen).reverse()
        .filter((specimen) => {
          if (this.useOrgWideSpecimens || !this.patientId) return true;
          return specimen.subject?.reference === `Patient/${this.patientId}`;
        });
      this.tableDataLevel2.next(specimens);
    });
  }

  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private fhirTransformService = inject(FhirResourceTransformService);
  private fhirResourceService = inject(FhirResourceService);
  // private errorService = inject(ErrorService);
  // private stateService = inject(StateService);
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
         resource.status = resource.status?.toLowerCase();
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



    
    // this.encounterService.addSpecimen(this.patientId || undefined);
  
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


  showSpecimenDetails(specimen: Specimen): void {
    this.dialog.open(SpecimenDetailsComponent, {
      maxWidth: '450px',
      maxHeight: '90vh',
      data: { specimen }
    });
  }

  onExportSpecimens(): void {
    console.warn('Export specimens not implemented yet.');
  }
}
