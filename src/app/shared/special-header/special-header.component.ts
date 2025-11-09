
import { TitleCasePipe } from '@angular/common';
import { Component, inject, Inject, Input, Optional } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { DetailBaseComponent } from '../../shared/detail-base/detail-base.component';
import { commonImports } from '../../shared/table-interface';
import { LinkInReferencesService } from '../../shared/link-in-references.service';
import { fetchFromReferencePipe } from "../../shared/Fetch.pipe";
import { CodeableReferenceDisplayComponent } from "../../shared/codeable-reference-display/codeable-reference-display.component";
import { baseStatusStyles } from '../statusUIIcons';
import { ReferenceDisplayComponent } from '../reference-display/reference-display.component';

@Component({
  selector: 'app-special-header',
  imports: [MatCardModule, TitleCasePipe, MatIconModule, MatDividerModule,
    ReferenceDisplayComponent,
    DetailBaseComponent, ...commonImports, fetchFromReferencePipe, CodeableReferenceDisplayComponent],

  templateUrl: './special-header.component.html',
  styleUrl: './special-header.component.scss'
})
export class SpecialHeaderComponent {
  statusStyles = baseStatusStyles;
  @Input() resourceObject?: any
  @Input() specialHeader?: any
}
