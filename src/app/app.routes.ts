import { Routes } from '@angular/router';
import { PatientsComponent } from './patients/patients.component';
import { patientsResolver } from './patients.resolver';
import { PatientsRecordComponent } from './patients-record/patients-record.component';
import { patientsRecordResolver } from './patients-record/patients-record.resolver';
import { PatientObservationComponent } from './patient-observation/patient-observation.component';
import { patObsResolver } from './patient-observation/pat-obs.resolver';
import { PatientWrapperComponent } from './patient-wrapper/patient-wrapper.component';
import { PatientConditionComponent } from './patient-condition/patient-condition.component';
import { patCondResolver } from './patient-condition/pat-cond.resolver';
import { NotFoundComponentComponent } from './not-found-component/not-found-component.component';
import { MedicationComponent } from './medication/medication.component';
import { medicationResolver } from './medication/medication.resolver';
import { AppWrapperComponent } from './app-wrapper/app-wrapper.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { appointmentResolver } from './appointment.resolver';
import { encounterResolver } from './encounter/encounter.resolver';
import { EncounterComponent } from './encounter/encounter.component';
import { DashboardsWrapperComponent } from './dashboards-wrapper/dashboards-wrapper.component';
import { LoginComponent } from './login/login.component';
import { appAuthGuard } from './shared/auth/app-auth.guard';
import { LabRequestsComponent } from './lab-requests/lab-requests.component';
import { labRequestsResolver } from './lab-requests/lab-requests.resolver';
import { DummyMedicationRequestDetailsComponent } from './dummy-medication-request-details/dummy-medication-request-details.component';
import { MedicineRequestsComponent } from './medicine-requests/medicine-requests.component';
import { medReqResResolver } from './medicine-requests/med-req-res.resolver';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { patRegResolver } from './patient-reg/pat-reg.resolver';

export const routes: Routes = [
    {
        path: "app",
        component: AppWrapperComponent,
        canActivate: [appAuthGuard],
        canActivateChild: [appAuthGuard],
        children: [
            {
                path: "dashboard",
                component: DashboardsWrapperComponent,

            },
            {
                path: "medicine-requests",
                component: MedicineRequestsComponent,
                resolve: {
                    medReqRes: medReqResResolver
                }

            },

            {
                path: "appointments",
                component: AppointmentComponent,
                resolve: { appointment: appointmentResolver }

            },

            {
                path: "tests-requests",
                component: LabRequestsComponent,
                resolve: { labRequests: labRequestsResolver }


            },

            {
                component: PatientsComponent,
                path: "patients",
                resolve: { patientsRegistrationData: patientsResolver }

            },
            {

                path: "patients/:id",
                component: PatientWrapperComponent,
                resolve: { patientData: patientsRecordResolver },
                children: [
                    {
                        path: "patients-reg",
                        component: PatientRegistrationComponent,
                        resolve: { patReg: patRegResolver }

                    },
                    {
                        path: "encounters",
                        resolve: { patientEncounter: encounterResolver },
                        component: EncounterComponent,
                        data: {
                            title: "Patient Encounter"
                        }

                    },
                    {
                        path: "observations",
                        resolve: { patientObservations: patObsResolver },
                        component: PatientObservationComponent,
                        data: { title: "Patient Observations" }
                    },
                    {
                        path: "conditions",

                        component: PatientConditionComponent,
                        resolve: { patCond: patCondResolver },
                        data: { title: "Patient Conditions" }

                    },
                    {
                        path: "medications",

                        component: MedicationComponent,
                        resolve: { patMed: medicationResolver },
                        data: { title: "Patient Medications" }

                    },


                    {
                        path: "summary",

                        component: PatientsRecordComponent,
                        resolve: { patientData: patientsRecordResolver },
                        data: { title: "Patient Summary" }

                    },

                    {
                        path: "",
                        redirectTo: "summary",
                        pathMatch: 'full'

                    },
                    {
                        path: "**",
                        component: NotFoundComponentComponent
                    }

                ]

            },
            {
                path: "",
                redirectTo: "dashboard",
                pathMatch: 'full'
            }
        ]

    },
    {
        path: "DummyMedicationRequest",
        component: DummyMedicationRequestDetailsComponent,

    },
    {
        path: "login",
        component: LoginComponent,
        data: {
            title: "Elikita | Login", breadCrumbTitle: "Login",

            breadCrumbIcon: "key"
        }
    },
    {
        path: "register",
        component: PatientRegistrationComponent
    },
    { path: "", redirectTo: "login", pathMatch: 'full' },
    { path: "**", component: NotFoundComponentComponent }
];
