import { PractitionerListComponent } from './practitioner-list/practitioner-list.component';
import { PractitionerDetailsComponent } from './practitioner-details/practitioner-details.component';
import { PractitionerRegistrationComponent } from './practitioner-registration/practitioner-registration.component';

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
import { PatientRegComponent } from './patient-reg/patient-reg.component';
import { MakeAppointmentsComponent } from './make-appointments/make-appointments.component';
import { SpecimenDetailsComponent } from './specimen/specimen-details/specimen-details.component';
import { HospitalDetailsComponent } from './hospital-details/hospital-details.component';
import { HospitalRegistrationComponent } from './hospital-registration/hospital-registration.component';
import { ServicesComponent } from './services/services.component';
import { ProfileComponent } from './profile/profile.component';
import { OrdersComponent } from './orders/orders.component';
import { AdmissionComponent } from './admission/admission.component';
import { TestingTasksComponent } from './testing-tasks/testing-tasks.component';
import { AddVitalsComponent } from './patient-observation/add-vitals/add-vitals.component';
import { TasksTableComponent } from './tasks/tasks-table/tasks-table.component';
import { AdmissionAnalyticsComponent } from './admission-analytics/admission-analytics.component';
import { PatientAdmissionWrapperComponent } from './patient-admission-wrapper/patient-admission-wrapper.component';
import { MedicationComponent2 } from './medication2/medication2.component';
import { AddMedicationComponent } from './medication2/add-medication/add-medication.component';
import { AllergyComponent } from './allergy/allergy.component';
import { PatientSidedetailsComponent } from './patient-sidedetails/patient-sidedetails.component';
import { TestingComponent } from './testing/testing.component';
import { ImmunizationComponent } from './immunization/immunization.component';
import { LabreportComponent } from './labreport/labreport.component';
import { AddReportComponent } from './labreport/add-report/add-report.component';
import { EncounterV2Component } from './encounter-v2/encounter-v2.component';
import { SpecimenComponent } from './specimen/specimen_old.component';
import { LabSupplyComponent } from './lab-supply/lab-supply.component';
import { SpecimensComponent } from './specimens/specimens.component';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { DetailsCardzComponent } from './details-cardz/details-cardz.component';
import { CardzDetailsCheckComponent } from './cardz-details-check/cardz-details-check.component';
import { AichatComponent } from './aichat/aichat.component';
import { BookingsFormComponent } from './bookings-form/bookings-form.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { CalendarComponent } from './calendar/calendar.component';
import { DocumentComponent } from './document/document.component';
import { AddObservationComponent } from './patient-observation/add-observation/add-observation.component';
import { CheckSheetComponent } from './check-sheet/check-sheet.component';
import { EncounterCheckComponent } from './encounter-check/encounter-check.component';
import { LaunchComponent } from './launch/launch.component';
import { AuthcallackComponent } from './authcallack/authcallack.component'
import { AzureUploadDemoComponent } from './upload-ui/azure-upload-demo.component';
import { PatientRegistrationCenterComponent } from './patient-registration-center/patient-registration-center.component';
import { patientRegistrationCenterResolver } from './patient-registration-center/patient-registration-center.resolver';
import { PatientRegistrationApprovedComponent } from './patient-registration-center/patient-registration-approved.component';
import { PatientRegistrationDeceasedComponent } from './patient-registration-center/patient-registration-deceased.component';
import { appWrapperDataResolver } from './app-wrapper/app-wrapper-data.resolver';
import { AdmissionLocationComponent } from './admission-location/admission-location.component';
import { AddAdmissionLocationComponent } from './admission-location/add-admission-location.component';

export const routes: Routes = [

    {
        path: 'practitioners/:id',
        component: PractitionerDetailsComponent,
        data: {
            title: 'Practitioner Details',
            breadCrumbTitle: 'Practitioner Details',
            breadCrumbIcon: 'badge',
            roles: ['admin', 'receptionist']
        }
    },
    {
        path: "practitioner-register",
        component: PractitionerRegistrationComponent
    },
    {
        path: "testing",
        component: TestingComponent,
        children: [
            {
                path: "encounter",
                component: EncounterCheckComponent
            },
            {
                path: "add-obs",
                component: AddObservationComponent
            },
            {
                path: "check-sheet",
                component: CheckSheetComponent
            },
            //admission'
            {
                path: "document",
                component: DocumentComponent
            },
            {
                path: "calendar",
                component: CalendarComponent,
            },
            {

                path: "ai-chat",
                component: AichatComponent
            },
            {
                path: "details",
                component: CardzDetailsCheckComponent

            },
            {
                path: "book-try",
                component: BookingsFormComponent
            },


            {
                path: "schedule",
                component: CreateScheduleComponent
            },
            {
                path: "add-medicine",
                component: AddMedicationComponent
            },
            {
                path: "ec-bills",
                component: EncounterV2Component

            }, {
                path: "lab-report",
                component: LabreportComponent

            },
            {
                path: "add-report",
                component: AddReportComponent

            },
            {
                path: "medicine",
                component: MedicationComponent2,

            },
            {
                path: "admission",
                component: AdmissionComponent,
                // resolve: { admission: admissionResolver }
            },
            {
                path: "admission-analytics",
                component: AdmissionAnalyticsComponent,

            },
            {
                path: "vitals",
                component: AddVitalsComponent,
            },
            {
                path: "tasks",
                component: TestingTasksComponent,


            },
            {

                path: "patientSide",
                component: PatientSidedetailsComponent
            },
            {
                path: "allergy",
                component: AllergyComponent,
            },
            {
                path: "task-list",
                component: TasksTableComponent,

            },
            {
                path: "tests-requests",
                component: LabRequestsComponent,
                resolve: { labRequests: labRequestsResolver }


            },
            {
                path: "claims",
                component: OrdersComponent,


            },
            {
                path: "invoice",
                component: InvoiceComponent
            },
            {
                path: "medicine-requests",
                component: MedicineRequestsComponent,
                resolve: { medReqRes: medReqResResolver }


            },
            {
                path: "specimen-details",
                component: SpecimenDetailsComponent,
                data: {
                    title: "Specimen Details", breadCrumbTitle: "Specimen Details",
                    breadCrumbIcon: "biotech"
                },
            },
            {
                path: "org",
                component: HospitalDetailsComponent,
                data: {
                    title: "Hospital Details", breadCrumbTitle: "Hospital Details",
                    breadCrumbIcon: "local_hospital"
                },
            },

            //services,
            {
                path: "org-services",
                component: ServicesComponent,
                data: {
                    title: "Available Services", breadCrumbTitle: "Available Services",
                    breadCrumbIcon: "work"
                }
            }
        ]
    },
    {
        path: "app",
        component: AppWrapperComponent,
        resolve: { orgWide: appWrapperDataResolver },
        canActivate: [appAuthGuard],
        canActivateChild: [appAuthGuard],
        children: [
            //medicine-stock
            {
                path: 'practitioners',
                component: PractitionerListComponent,
                data: {
                    title: 'Pending Practitioners',
                    breadCrumbTitle: 'Practitioners',
                    breadCrumbIcon: 'badge',

                }
            },
            {
                path: "org-reg",
                component: HospitalRegistrationComponent,
                data: {
                    title: "Hospital Registration", breadCrumbTitle: "Hospital Registration",
                    breadCrumbIcon: "add_business"
                },
            },
            {
                path: "document",
                component: DocumentComponent
            },
            {
                path: "calendar",
                component: CalendarComponent,
            },
            {
                path: "schedule",
                component: CreateScheduleComponent

            },
            {
                path: "tasks",
                component: TasksTableComponent,
            },
            {
                path: "specimens",
                component: SpecimensComponent,
            },
            {
                path: "lab-supplies",
                component: LabSupplyComponent

            },
            {
                path: "medicine-stock",
                component: MedicationComponent2
            },
            {
                path: "admission",
                component: AdmissionComponent,
                // resolve: { admission: admissionResolver }
            },
            {
                path: "admission-location",
                component: AdmissionLocationComponent
            },
            {
                path: "admission-location/add",
                component: AddAdmissionLocationComponent
            },
            {
                path: "claims",
                component: OrdersComponent,


            },
            {
                path: "patient-bills",
                component: EncounterV2Component,


            },

            {
                path: "invoice",
                component: InvoiceComponent
            },
            {
                path: "profile",
                component: ProfileComponent

            },
            {
                path: "org-services",
                component: ServicesComponent,
                data: {
                    title: "Available Services", breadCrumbTitle: "Available Services",
                    breadCrumbIcon: "work"
                }
            },

            {
                path: "org",
                component: HospitalDetailsComponent,
                data: {
                    title: "Hospital Details", breadCrumbTitle: "Hospital Details",
                    breadCrumbIcon: "local_hospital"
                }

            },
            {
                path: "dashboard",
                component: DashboardsWrapperComponent,

            },
            {
                path: "patient-registration",
                component: PatientRegistrationCenterComponent,
                resolve: { patientCenter: patientRegistrationCenterResolver },
                data: {
                    title: "Patient Registration", breadCrumbTitle: "Patient Registration",
                    breadCrumbIcon: "person_add"
                },
                children: [
                    { path: '', redirectTo: 'pending', pathMatch: 'full' },
                    { path: 'pending', component: PatientRegComponent },
                    { path: 'approved', component: PatientRegComponent },
                    { path: 'deceased', component: PatientRegComponent },
                ]
            },
            { path: "patient-registration-data", redirectTo: "patient-registration", pathMatch: 'full' },
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
                path: "appointments/add",
                component: MakeAppointmentsComponent
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
                component: PatientsComponent,
                path: "admitted-patients",
                resolve: { patientsRegistrationData: patientsResolver }

            },
            {
                path: "admitted-patients/:id",
                component: PatientAdmissionWrapperComponent,
                children: [
                    {
                        path: "tasks",
                        component: TasksTableComponent,
                    },
                    {
                        path: "analytics",
                        component: AdmissionAnalyticsComponent
                    },
                    {
                        path: "",
                        redirectTo: "tasks",
                        pathMatch: 'full'
                    }
                ],
                // resolve: { admission: admissionResolver }

            },
            {

                path: "patients/:id",
                component: PatientWrapperComponent,
                resolve: { patientData: patientsRecordResolver },
                children: [
                    //allergies
                    {
                        path: "tests-requests",
                        component: LabRequestsComponent,
                        resolve: { labRequests: labRequestsResolver }


                    },

                    {
                        path: "allergies",
                        component: AllergyComponent

                    },
                    //immunizations
                    {
                        path: "immunizations",
                        component: ImmunizationComponent

                    },


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
                        path: "diagnosis",

                        component: PatientConditionComponent,
                        resolve: { patCond: patCondResolver },
                        data: { title: "Patient Diagnosis" }

                    },
                    {
                        path: "tests-requests",
                        component: LabRequestsComponent,
                        resolve: { labRequests: labRequestsResolver }


                    },
                    // {
                    //     path: "medications",

                    //     component: MedicationComponent,
                    //     resolve: { patMed: medicationResolver },
                    //     data: { title: "Patient Medications" }

                    // },
                    {
                        path: "medications",

                        component: MedicineRequestsComponent,
                        resolve: {
                            medReqRes: medReqResResolver
                        },
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
        path: "auth/callback",
        component: AuthcallackComponent,
        data: {
            title: "Elikita | Login Redirect", breadCrumbTitle: "login-redirect",

            breadCrumbIcon: "key"
        }
    },

    {
        path: "launch",
        component: LaunchComponent,
        data: {
            title: "Elikita | Login", breadCrumbTitle: "Login",

            breadCrumbIcon: "key"
        }
    },

    {
        path: "register",
        component: PatientRegistrationComponent
    },
    {
        path: "upload-demo",
        component: AzureUploadDemoComponent
    },

    { path: "", redirectTo: "launch", pathMatch: 'full' },
    { path: "**", redirectTo: 'launch' },
    //upload-demo

];
