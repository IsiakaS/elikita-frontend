import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PatObsRecordHolderService {
  chosenProperties: any[] = ['basedOn', 'category', 'code', 'subject', 'performer', 'referenceRange', 'value[x]', 'status', 'effective[x]', 'component', 'issued'];
  fhirResourceGuides = {
    condition: {
      keyProperties: [
        "clinicalStatus",
        "verificationStatus",
        "category",
        "severity",
        "code",
        "subject",
        "encounter",
        "onsetDateTime",       // or onset[x]
        "abatementDateTime",   // or abatement[x]
        "recordedDate",
        "asserter",
        "note"
      ],
      generalName: "Diagnoses"
    },
    encounter: {
      keyProperties: [
        "status",
        "class",
        "type",
        "subject",
        "participant",
        "period",
        "reasonCode",
        "diagnosis",
        "location",
        "serviceProvider"
      ],
      generalName: "Visits"
    }
  };

  constructor() { }
}
