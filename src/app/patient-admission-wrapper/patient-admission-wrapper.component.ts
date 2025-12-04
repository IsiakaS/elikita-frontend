import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatMenuModule } from '@angular/material/menu';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { PatientSidedetailsComponent } from '../patient-sidedetails/patient-sidedetails.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { TopActionsService } from '../app-wrapper/top-actions.service';
import { AdmissionService } from '../admission/add-admission/admission.service';
import { TestingTasksComponent } from '../testing-tasks/testing-tasks.component';
import { StateService } from '../shared/state.service';
import { backendEndPointToken } from '../app.config';
import { Bundle, Encounter } from 'fhir/r4';
//import { PatientAdmissionWrapperComponent } from '../patient-admission-wrapper/patient-admission-wrapper.component';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-patient-admission-wrapper',
  imports: [MatTabsModule,
    MatButtonModule,
    PatientSidedetailsComponent, MatSidenavModule,
    SidemenuComponent, DashboardsWrapperComponent, TopbreadcrumbComponent, TopProfileComponent,
    RouterOutlet, TitleCasePipe, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule,

    AsyncPipe
  ],
  templateUrl: './patient-admission-wrapper.component.html',
  styleUrl: './patient-admission-wrapper.component.scss'
})
export class PatientAdmissionWrapperComponent implements OnInit {
  links: string[] = ['tasks', 'analytics', 'Observations'];
  activeLink = this.links[0];

  // Inject services
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private stateService = inject(StateService);
  private backendUrl = inject(backendEndPointToken);
  private errorService = inject(ErrorService);

  ngOnInit(): void {
    this.checkAndSetCurrentEncounter();
  }

  /**
   * Gets patient ID from route, searches for the patient's latest encounter,
   * checks if it's in progress, and sets it in StateService.
   * 
   * This method does two things:
   * 1. Searches the database for the patient's latest encounter
   * 2. Sets the current encounter in StateService if it's in progress
   */
  private checkAndSetCurrentEncounter(): void {
    // Get patient ID from route parameter
    this.route.paramMap.subscribe(params => {
      const patientId = params.get('id');

      if (!patientId) {
        console.warn('No patient ID found in route');
        return;
      }

      console.log('Patient ID from route:', patientId);

      // Search for encounters for this patient, sorted by date (newest first)
      const searchUrl = `${this.backendUrl}/Encounter?subject=Patient/${patientId}&_sort=-date&_count=1`;

      this.http.get<Bundle>(searchUrl).pipe(
        map(bundle => {
          // Get the latest encounter (first in the sorted list)
          const latestEncounterEntry = bundle.entry?.[0];
          return latestEncounterEntry?.resource as Encounter | undefined;
        }),
        catchError(error => {
          console.error('Error fetching patient encounters:', error);
          this.errorService.openandCloseError('Failed to fetch patient encounters');
          return of(undefined);
        })
      ).subscribe(latestEncounter => {
        if (!latestEncounter) {
          console.log('No encounters found for patient:', patientId);
          // Clear current encounter since there isn't one
          this.stateService.setCurrentEncounter(null);
          return;
        }

        console.log('Latest encounter found:', latestEncounter);
        console.log('Encounter status:', latestEncounter.status);

        // Check if the encounter is in progress
        if (latestEncounter.status === 'in-progress') {
          console.log('Setting in-progress encounter as current encounter');

          // Set the current encounter in StateService
          this.stateService.setCurrentEncounter({
            ...latestEncounter,
            status: latestEncounter.status,
            patientId: patientId
          });
        } else {
          console.log(`Latest encounter is not in progress (status: ${latestEncounter.status}). Not setting as current encounter.`);

          // Optionally clear the current encounter if it's not in progress
          // this.stateService.setCurrentEncounter(null);

          // Or keep the encounter anyway for reference
          this.stateService.setCurrentEncounter({
            ...latestEncounter,
            status: latestEncounter.status,
            patientId: patientId
          });
        }
      });
    });
  }
}
