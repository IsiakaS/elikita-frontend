import { Component, EventEmitter, Inject, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, FormFields, SingleCodeField, CodeableConceptFieldFromBackEnd, IndividualField, generalFieldsData } from '../shared/dynamic-forms.interface2';
import { AuthService } from '../shared/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { backendEndPointToken } from '../app.config';

@Component({
    selector: 'app-addpatientondition',
    standalone: true,
    imports: [CommonModule, DynamicFormsV2Component, MatCardModule, MatButtonModule],
    template: `
  `,
    styles: [`mat-card { max-width: 640px; margin: 0 auto; }`]
})
export class AddPatientOnditionComponent {
    @Input() patientId!: string;
    @Output() conditionAdded = new EventEmitter<any>();

    auth = inject(AuthService);
    canAdd = false;
    backendEndPoint = inject(backendEndPointToken);

    fields: FormFields[] = [];

    ngOnInit() {
        this.canAdd = this.auth.can('condition', 'add');
        if (!this.canAdd) return;

    }



    onSubmit(values: any) {

    }
}
