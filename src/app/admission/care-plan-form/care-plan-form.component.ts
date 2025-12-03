import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { TestingTasksComponent } from '../../testing-tasks/testing-tasks.component';

@Component({
    selector: 'app-care-plan-form',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        DynamicFormsV2Component,
        TestingTasksComponent
    ],
    templateUrl: './care-plan-form.component.html',
    styleUrl: './care-plan-form.component.scss'
})
export class CarePlanFormComponent implements OnInit {
    @Input() carePlanFormFields: any;
    @Input() admissionSubmitted: boolean = false;

    displayTaskForm = false;

    ngOnInit() {
        // Component initialization
    }

    showTaskForm() {
        this.displayTaskForm = !this.displayTaskForm;
    }
}
