import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Input, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AgePipe } from '../age.pipe';
import { PatientDetailsKeyService } from './patient-details-key.service';

@Component({
  selector: 'app-patient-sidedetails',
  imports: [MatIconModule, MatCardModule, TitleCasePipe, AgePipe, DatePipe],
  templateUrl: './patient-sidedetails.component.html',
  host: {
    class: 'container-bg'
  },
  styleUrl: './patient-sidedetails.component.scss'
})
export class PatientSidedetailsComponent {
  @Input() resolvedData: any
  viewContainer = inject(ViewContainerRef)
  @ViewChild('patientDetails') patientDetailStrip!: TemplateRef<any>
  patientDetailsStripKeyService = inject(PatientDetailsKeyService)
  ngOnChanges() {
    if (this.resolvedData) {
      console.log(this.resolvedData)
    }
  }
  ngAfterViewInit() {
    this.patientDetailsStripKeyService.patientDetailsStripStatus.subscribe((data) => {
      if (this.resolvedData && data) {
        console.log(this.resolvedData);
        this.viewContainer.createEmbeddedView(this.patientDetailStrip)
      } else {
        this.viewContainer.remove();
      }

    })

  }
}
