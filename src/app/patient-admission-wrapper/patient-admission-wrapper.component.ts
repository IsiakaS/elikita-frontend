import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable } from 'rxjs';
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
export class PatientAdmissionWrapperComponent {
  links: string[] = ['tasks', 'analytics', 'Observations'];
  activeLink = this.links[0];
}
