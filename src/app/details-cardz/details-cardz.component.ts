import { Component, Input } from '@angular/core';
import { CodeableConcept2Pipe } from "../shared/codeable-concept2.pipe";
import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
import { ReferenceDisplayComponent } from "../shared/reference-display/reference-display.component";
import { DatePipe, JsonPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-details-cardz',
  imports: [CodeableConcept2Pipe, DatePipe,
    TitleCasePipe, JsonPipe,
    CodeableReferenceDisplayComponent, ReferenceDisplayComponent],
  templateUrl: './details-cardz.component.html',
  styleUrls: ['../dummy-medication-request-details/dummy-medication-request-details.component.scss', './details-cardz.component.scss']
})
export class DetailsCardzComponent {
  @Input() group?: any;
  @Input() resources?: any;

  retrieveValueFromDeepPath(data: any, deepPath: string | string[] | null): any {
    if (!data && !deepPath) {
      return null;
    }
    if (!deepPath) {
      return data;
    }
    if (typeof deepPath === 'string') {
      deepPath = deepPath.split('$#$');
    }
    return deepPath.reduce((acc, key) => {
      // console.log('key', key, 'acc', acc, acc?.[key]);
      return acc && acc[key];
    }, data);
  }

  alltds(fg?: any) {
    if (fg) {
      fg.classList.toggle('over-other-group');
    }
  }

}
