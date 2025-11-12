

import { Component, inject, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, IndividualField, generalFieldsData } from '../shared/dynamic-forms.interface2';
import { CodeableConcept, MedicationRequest, Practitioner } from 'fhir/r4';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, catchError, map, mergeMap, Observable, switchMap, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorService } from '../shared/error.service';
import { AgePipe } from "../age.pipe";
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
import { AuthService } from '../shared/auth/auth.service';
import { PractitionerRole } from 'fhir/r5';
import { CodeableConcept2Pipe } from "../shared/codeable-concept2.pipe";

export type PractitionerReg = Practitioner & { status: string }
@Component({

    selector: 'app-practitioner-details',
    imports: [MatCardModule, MatButtonModule,
        AsyncPipe,
        MatDividerModule, DatePipe, CommonModule,
        TitleCasePipe, MatIconModule, AgePipe, MatTabsModule, CodeableConcept2Pipe],
    templateUrl: './practitioner-details.component.html',
    styleUrls: ['../dummy-medication-request-details/dummy-medication-request-details.component.scss', './practitioner-details.component.scss']
})

export class PractitionerDetailsComponent {


    deleteRole(role: any) {
        // Try to get the id for the PractitionerRole resource
        let roleId = role?.id || (role?.resource && role.resource.id);
        if (!roleId) {
            this.errorService.openandCloseError('Cannot determine role ID to delete.');
            return;
        }
        this.http.delete(`https://elikita-server.daalitech.com/PractitionerRole/${roleId}`).subscribe({
            next: () => {
                this._sn.open('Role deleted successfully!', 'Close', { duration: 3000 });
                // Refresh roles from server
                this.http.get(
                    `https://elikita-server.daalitech.com/PractitionerRole?practitioner=Practitioner/${this.data?.id}&_format=json`).pipe(
                        map((res: any) => {
                            console.log('PractitionerRole response:', res);
                            return res.entry && res.entry.length ? res.entry.map((e: any) => { return { ...e, code: e.resource.code[0] } }) : [{ code: { text: 'no role' } }]
                        }),
                        tap(res => { this.currentRoles = res.map((r: any) => r.code?.text); })
                    ).subscribe({
                        next: (roles) => {
                            this.practitionerRole$?.next(roles);
                        }
                    });
            },
            error: () => {
                this.errorService.openandCloseError('Failed to delete role.');
            }
        });
    }

    @Input() inputData?: PractitionerReg
    http = inject(HttpClient);
    private _sn = inject(MatSnackBar);
    statuStyles: any;
    data: PractitionerReg | null = inject(MAT_DIALOG_DATA, { optional: true });
    dialogRef = inject(MatDialogRef<PractitionerDetailsComponent>, { optional: true });
    errorService = inject(ErrorService);
    ngOnInit() {
        this.statuStyles = baseStatusStyles
        if (this.data) {
            this.http.get(
                `https://elikita-server.daalitech.com/PractitionerRole?practitioner=Practitioner/${this.data.id}&_format=json`).pipe(
                    map((res: any) => {
                        console.log('PractitionerRole response:', res);
                        return res.entry && res.entry.length ? res.entry.map((e: any) => { return { ...e, code: e.resource.code[0] } }) : [{ code: { text: 'no role' } }]
                    }),
                    tap(res => { this.currentRoles = res.map((r: any) => r.code?.text); })
                ).subscribe({
                    next: (roles) => {
                        // alert('roles: ' + JSON.stringify(roles));
                        this.practitionerRole$?.next(roles);
                    }
                });

        }
    }
    dialog = inject(MatDialog);
    currentRoles?: any
    updateRole() {
        // alert(this.currentRoles.join(', '));
        // Get roles from AuthService (from login logic)
        const roles = [
            'admin', 'receptionist', 'doctor', 'nurse', 'lab', 'pharmacy', 'patient', 'cashier', 'consultant'
        ].map(r => r.toLowerCase());

        const dialogRef = this.dialog.open(DynamicFormsV2Component, {
            maxWidth: '400px',
            data: {
                formMetaData: <formMetaData>{
                    formName: 'Update Practitioner Role',
                    formDescription: 'Choose a new role for this practitioner',
                    submitText: 'Update Role',
                    closeDialogOnSubmit: true
                },
                formFields: [<IndividualField>{
                    generalProperties: <generalFieldsData>{
                        fieldApiName: 'role',
                        fieldName: 'Role',
                        fieldLabel: 'Role',
                        fieldType: 'SingleCodeField',
                        inputType: 'select',
                        isArray: false,
                        isGroup: false,
                        auth: { read: 'all', write: 'admin' },
                    },
                    data: roles.filter(role => this.currentRoles
                        ? !this.currentRoles?.includes(role) : true).map(role => role[0].toUpperCase() + role.substring(1))

                    // data: roles
                }]
            }
        });
        dialogRef.afterClosed().subscribe((result: any) => {
            // alert('Result: ' + JSON.stringify(result));
            if (!result || !result.values || !result.values.role) return;
            // Build PractitionerRole resource
            const practitionerRole = {
                resourceType: 'PractitionerRole',
                practitioner: { reference: `Practitioner/${this.data?.id}` },
                organization: { reference: 'Organization/dummy-org' },
                code: [{ text: result.values.role.toLowerCase() }]
            };
            this.http.post('https://elikita-server.daalitech.com/PractitionerRole', practitionerRole, {

            }).subscribe({
                next: () => {
                    this._sn.openFromComponent(SuccessMessageComponent, {
                        data: { message: 'Role updated successfully!' },
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                    });
                    this._sn.open('Role updated successfully!', 'Close', { duration: 3000 });
                    this.http.get(
                        `https://elikita-server.daalitech.com/PractitionerRole?practitioner=Practitioner/${this.data?.id}&_format=json`).pipe(
                            map((res: any) => {
                                console.log('PractitionerRole response:', res);
                                return res.entry && res.entry.length ? res.entry.map((e: any) => { return { ...e, code: e.resource.code[0] } }) : [{ code: { text: 'no role' } }]
                            }),
                            tap(res => { this.currentRoles = res.map((r: any) => r.code?.text); })
                        ).subscribe({
                            next: (roles) => {
                                this.practitionerRole$?.next(roles);
                            }
                        });
                },
                error: () => {
                    this.errorService.openandCloseError('Failed to update role.');
                }
            });
        });
    }
    ngOnChanges() {
        if (!this.data && this.inputData) {
            this.data = this.inputData;
        }
        if (this.data) {
            this.http.get(
                `https://elikita-server.daalitech.com/PractitionerRole?practitioner=Practitioner/${this.data?.id}&_format=json`).pipe(
                    map((res: any) => {
                        console.log('PractitionerRole response:', res);
                        return res.entry && res.entry.length ? res.entry.map((e: any) => { return { ...e, code: e.resource.code[0] } }) : [{ code: { text: 'no role' } }]
                    }),
                    tap(res => { this.currentRoles = res.map((r: any) => r.code?.text); })
                ).subscribe({
                    next: (roles) => {
                        this.practitionerRole$?.next(roles);
                    }
                });

        }
    }
    auth = inject(AuthService);
    canAddPatientRegistration(): boolean {
        return this.auth.can('patient', 'add');
    }
    // Approve: fetch original Practitioner then PUT with active=true
    approvePractitioner() {
        const id = this.data?.id;
        if (!id) {
            this.errorService.openandCloseError('Missing practitioner id.');
            return;
        }
        const url = `https://elikita-server.daalitech.com/Practitioner/${id}`;
        this.http.get<Practitioner>(url).pipe(
            catchError(err => throwError(() => ({ _stage: 'get', error: err }))),
            switchMap((practitioner) => {
                const updated: Practitioner = { ...practitioner, active: true } as Practitioner;
                const headers = new HttpHeaders({
                    'Content-Type': 'application/fhir+json',
                    'Accept': 'application/fhir+json'
                });
                return this.http.put<Practitioner>(url, updated, { headers }).pipe(
                    tap((e) => { console.log(e) }),
                    catchError(err => throwError(() => ({ _stage: 'put', error: err })))
                );
            })
        ).subscribe({
            next: (res) => {
                this._sn.openFromComponent(SuccessMessageComponent, {
                    data: { message: 'Practitioner approved. You can now find them on the Practitioners page.', action: 'View Practitioner' },
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                });
                this.dialogRef?.close({ approved: true, id, resource: res });
            },
            error: (err) => {
                const stage = (err && err._stage) ? err._stage : 'unknown';
                const cause = (err && err.error) ? err.error : err;
                if (stage === 'get') {
                    this.errorService.openandCloseError('Could not load practitioner for approval. Please try again.');
                } else if (stage === 'put') {
                    this.errorService.openandCloseError('Could not approve practitioner (update failed). Please try again.');
                } else {
                    this.errorService.openandCloseError('Could not approve practitioner. Please try again.');
                }
            }
        });
    }
    practitionerRole$? = new BehaviorSubject<any | null>(null)
    rejectPractitioner() {
        const id = this.data?.id;
        if (!id) {
            this.errorService.openandCloseError('Missing practitioner id.');
            return;
        }
        if (!confirm('Are you sure you want to reject and delete this practitioner registration? This action cannot be undone.')) {
            return;
        }
        const url = `https://elikita-server.daalitech.com/Practitioner/${id}`;
        this.http.delete(url).subscribe({
            next: () => {
                this.dialogRef?.close({ approved: false, rejected: true, id });
            },
            error: (err) => {
                this.errorService.openandCloseError('Could not delete practitioner. Please try again.');
            }
        });
    }
}
