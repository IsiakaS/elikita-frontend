import { TitleCasePipe } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CodeableReferenceDisplayComponent } from '../shared/codeable-reference-display/codeable-reference-display.component';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';
import { ReferenceDisplayComponent } from '../shared/reference-display/reference-display.component';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { Resource } from 'fhir/r4';
import { commonImports } from '../shared/table-interface';

import { DetailsBuilderObject, DetailsBuilderService } from '../detailz-viewz/details-builder.service';
import { ChipsDirective } from "../chips.directive";
import { NaPipe } from "../shared/na.pipe";

@Component({
  selector: 'app-special-header-v2',
  imports: [MatCardModule, TitleCasePipe, MatIconModule, MatDividerModule,
    ReferenceDisplayComponent, ChipsDirective,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent, ChipsDirective, NaPipe],

  templateUrl: './special-header-v2.component.html',
  styleUrls: ['../special-header/special-header.component.scss','./special-header-v2.component.scss']
})
export class SpecialHeaderV2Component {
  detailsBuilderService = inject(DetailsBuilderService);
  statusStyles = baseStatusStyles;
  @Input() resourceObject?: any
  @Input() specialHeader?: DetailsBuilderObject['specialHeader'];
    refinedResourceData: Record<string, any> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!('resourceObject' in changes) || !this.resourceObject?.resourceType) return;

    const { resourceType, ...payload } = this.resourceObject as Resource & Record<string, any>;
    this.refinedResourceData = this.detailsBuilderService.stringifyResource(
      resourceType,
      payload,
      
    );
  }
}
