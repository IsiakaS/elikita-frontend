import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { PatientRegistrationCenterStore } from './patient-registration-center.store';
import { Bundle } from 'fhir/r4';

@Component({
    selector: 'app-patient-registration-center',
    standalone: true,
    imports: [CommonModule, RouterModule, MatTabsModule, MatIconModule],
    providers: [PatientRegistrationCenterStore],
    templateUrl: './patient-registration-center.component.html',
    styleUrl: './patient-registration-center.component.scss'
})
export class PatientRegistrationCenterComponent {
    route = inject(ActivatedRoute);
    store = inject(PatientRegistrationCenterStore);

    ngOnInit() {
        const bundle = this.route.snapshot.data['patientCenter'] as Bundle | undefined;
        this.store.setFromBundle(bundle);
    }
}
