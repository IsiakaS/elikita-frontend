import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDataReviewComponent } from './patient-data-review.component';

describe('PatientDataReviewComponent', () => {
    let component: PatientDataReviewComponent;
    let fixture: ComponentFixture<PatientDataReviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PatientDataReviewComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PatientDataReviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
