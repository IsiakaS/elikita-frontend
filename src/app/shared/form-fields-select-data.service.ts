import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, Subject, throwError } from 'rxjs';
import { LoadingUIEnabled } from '../loading.interceptor';

@Injectable({
  providedIn: 'root'
})
export class FormFieldsSelectDataService {
  allUrls = {
    'patient': {
      'gender': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender&_format=json",
      'maritalStatus': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/marital-status&_format=json",
      'relationship': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/patient-contactrelationship&_format=json",
      'general_practitioner': "http://hapi.fhir.org/baseR5/Practitioner?_format=json",
      'contactPointUse': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-use&_format=json",
      'contactPointSystem': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-system&_format=json",

    },
    'observation': {

    },
    'encounter': {

    },
    'serviceRequest': {
      'status': "https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-status&_format=json",
      'intent': "https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-intent&_format=json",
      'priority': "https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-priority&_format=json",
      'code': "/dummy.json",
      'performerType': "http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/participant-role&_FORMAT=JSON",

    },
    'medication': {
      'medication': "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/763158003&_format=json",
      'status': "/medication/status.json",
      'intent': "/medication/intent.json",
      'performerType': "/medication/performerType.json",
      'reason': "/dummy.json",
    },
    'medication_dispense': {
      'status': "http://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medicationdispense-status&_format=json",
      'subject': "https://server.fire.ly/r5/Patient?_format=json",
      'receiver': "https://server.fire.ly/r5/Patient?_format=json",
      'medication': "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/763158003&_format=json",

    },
    'medication_administration': {
      'status': "http://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-admin-status&_format=json",
      'medication': "/dummy.json",
      'subject': "http://hapi.fhir.org/baseR5/Patient?_format=json",
      "performer": "http://hapi.fhir.org/baseR5/Practitioner?_format=json",
      "request": "http://hapi.fhir.org/baseR5/MedicationRequest?_format=json"

    },
    'specimen': {
      'status': "http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/specimen-status&_FORMAT=JSON",
      "type": "http://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v2-0487&_FORMAT=JSON",
      "subject": "https://hapi.fhir.org/baseR4/Patient",
      "collector": "/encounter/encounter_participant.json",
      "bodySite": "/dummy.json",
      "condition": "http://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v2-0493&_FORMAT=JSON"
    }
  };




  transformValues = {
    patient: {
      //  'patient': {
      //       'gender': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender&_format=json",
      //       'maritalStatus': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/marital-status&_format=json",
      //       'relationship': "https://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/patient-contactrelationship&_format=json",
      //       'general_practitioner': "http://hapi.fhir.org/baseR5/Practitioner?_format=json",

      gender: (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}`;
        });
      },
      'maritalStatus': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'relationship': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'general_practitioner': (value: any) => {
        console.log(value);
        return value.entry.filter((e: any) => {
          if (e.resource.name && e.resource.name.length && e.resource.name[0].given && e.resource.name[0].given.length
            && e.resource.name[0].family
          ) {
            return true;
          } else {
            return false;
          }
        }).map((item: any) => {
          console.log(item, "in subject");
          return `${item.fullUrl}$#$${item.resource.name[0].given[0]} ${item.resource.name[0].family}`;
        });
      },

      'contactPointUse': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}`;
        });
      },
      'contactPointSystem': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}`;
        });
      },

    },
    specimen: {
      'status': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'type': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'subject': (value: any) => {
        console.log(value);
        return value;
      },

      'collector': (value: any) => {
        console.log(value);
        return value;
      },
      'bodySite': (value: any) => {
        return ['https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/bodySite&_format=json']

      },

      'condition': (value: any) => {
        console.log(value);
        return value.expansion.contains.map((item: any) => {

          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },


    },
    medication_administration: {
      // 'status': "http://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-admin-status&_format=json",
      // 'medication': "/dummy.json",
      // 'subject': "http://hapi.fhir.org/baseR5/Patient?_format=json",
      // "performer": "http://hapi.fhir.org/baseR5/Practitioner?_format=json",
      // "request": "h

      'status': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'medication': (value: any) => {
        return ['http://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-codes&_format=json']
      },


      'subject': (value: any) => {
        return value.entry.filter((e: any) => {
          if (e.resource.name && e.resource.name.length && e.resource.name[0].given && e.resource.name[0].given.length
            && e.resource.name[0].family
          ) {
            return true;
          } else {
            return false;
          }
        }).map((item: any) => {
          console.log(item, "in subject");
          return `${item.fullUrl}$#$${item.resource.name[0].given[0]} ${item.resource.name[0].family}`;
        });
      },

      'performer': (value: any) => {
        return value.entry.filter((e: any) => {
          if (e.resource.name && e.resource.name.length && e.resource.name[0].given && e.resource.name[0].given.length
            && e.resource.name[0].family
          ) {
            return true;
          } else {
            return false;
          }
        }).map((item: any) => {
          console.log(item, "in subject");
          return `${item.fullUrl}$#$${item.resource.name[0].given[0]} ${item.resource.name[0].family}`;
        });
      },
      'request': (value: any) => {
        return value.entry.map((item: any) => {

          return `${item.fullUrl}`;
        });
      },

    },
    medication: {
      'medication': (value: any) => {
        //console.log(value);
        return value.expansion.contains.map((item: any) => {
          // return {
          //   code: item.code,
          //   display: item.display,
          //   system: item.system
          // };
          ///alert(`${item.code}$#$${item.display}$#$${item.system}`);
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'performerType': (value: any) => {
        return value.concept.map((item: any) => {

          return {
            code: item.code,
            display: item.display,
            system: value.url
          };
        });
      },
      'reason': (value: any) => {
        return ['https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/condition-code&_format=json']
        // return value.expansion.contains.map((item: any) => {
        //   // return {
        //   //   code: item.code,
        //   //   display: item.display,
        //   //   system: item.system
        //   // };
        //   ///alert(`${item.code}$#$${item.display}$#$${item.system}`);
        //   return `${item.code}$#$${item.display}$#$${item.system}`;
        //}
        // );

      }





    },
    'medication_dispense': {
      'status': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'subject': (value: any) => {
        return value.entry.map((item: any) => {
          console.log(item, "in subject");
          return `${item.fullUrl}$#$${item.resource.name[0].given[0]} ${item.resource.name[0].family}`;
        });
      },
      'receiver': (value: any) => {
        return value.entry.map((item: any) => {

          return `${item.fullUrl}$#$${item.resource.name[0].given[0]} ${item.resource.name[0].family}`;
        });
      },
      'medication': (value: any) => {
        //console.log(value);
        return value.expansion.contains.map((item: any) => {
          // return {
          //   code: item.code,
          //   display: item.display,
          //   system: item.system
          // };
          ///alert(`${item.code}$#$${item.display}$#$${item.system}`);
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
    },
    serviceRequest: {
      'status': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'intent': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'priority': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'performerType': (value: any) => {
        return value.expansion.contains.map((item: any) => {
          return `${item.code}$#$${item.display}$#$${item.system}`;
        });
      },
      'code': (value: any) => {
        return ['https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/procedure-code&_FORMAT=JSON']
      },

    }
  }


  http = inject(HttpClient)

  constructor() {

  }

  getFormFieldSelectData(...fieldPaths: string[]): Observable<any> {
    if (fieldPaths.length) {
      if (this.checkIfPropertiesExist(this.allUrls, ...fieldPaths)) {
        const url = this.getDeepValues(this.allUrls, ...fieldPaths);
        console.log('URL:', url);
        return this.http.get(url, {
          context: new HttpContext().set(LoadingUIEnabled, true)
        }).pipe(map((data) => {
          if (this.checkIfPropertiesExist(this.transformValues, ...fieldPaths)) {
            const transformedValue = this.getDeepValues(this.transformValues, ...fieldPaths)(data);
            console.log(transformedValue);
            return transformedValue;


          } else {
            return data;
            console.log(data);
          }
        }));
      }
      else {
        console.error('No url exists for the given field paths', fieldPaths);
        return throwError(() => new Error('No url exists for the given field paths'));
      }

    } else {
      return throwError(() => new Error('No field paths provided'));
    }

  }


  getDeepValues(object: { [key: string]: any }, ...deepeningProperties: any[]) {
    if (this.checkIfPropertiesExist(object, ...deepeningProperties)) {
      let highLevelObject = object[deepeningProperties[0]]
      let highLevelPropertyIndex = 1;
      while (highLevelPropertyIndex < deepeningProperties.length) {
        highLevelObject = highLevelObject[deepeningProperties[highLevelPropertyIndex]]
        highLevelPropertyIndex++;


      }
      return highLevelObject;

    } else {
      return null;
    }
  }


  checkIfPropertiesExist(object: { [key: string]: any }, ...deepeningProperties: any[]) {
    console.log('Checking if properties exist:', deepeningProperties);
    if (deepeningProperties.length) {
      let highLevelProperty = 0;
      let allPropertiesExists = false;
      while (highLevelProperty < deepeningProperties.length) {
        console.log('Checking property:', deepeningProperties[highLevelProperty],);
        if (highLevelProperty === 0) {
          object = object[deepeningProperties[highLevelProperty]];
          console.log('Current object:', object);
          highLevelProperty++;
          allPropertiesExists = true;
        } else {


          if (object.hasOwnProperty(deepeningProperties[highLevelProperty])) {
            // console.log('past object:', object);
            // console.log('Property exists:', deepeningProperties[highLevelProperty]);
            allPropertiesExists = true;

            object = object[deepeningProperties[highLevelProperty]];
            // console.log('Current object:', object);
            highLevelProperty++;
          } else {
            allPropertiesExists = false;
            break;
            console.error('Property does not exist:', deepeningProperties[highLevelProperty]);
          }


          // return object[deepeningProperties[highLevelProperty - 1]].hasOwnProperty(deepeningProperties[highLevelProperty])
        }
      }



      return allPropertiesExists;
    } else {
      return false;
    }


  }
}
