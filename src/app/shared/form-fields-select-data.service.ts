import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, Subject, throwError } from 'rxjs';
import { LoadingUIEnabled } from '../loading.interceptor';
import { Bundle, BundleEntry, CodeableConcept, CodeSystem, HealthcareService, Practitioner, Reference, ValueSet, Location, Patient, Encounter } from 'fhir/r5';
import { ReferenceDataType } from './dynamic-forms.interface2';

@Injectable({
  providedIn: 'root'
})
export class FormFieldsSelectDataService {
  allUrls = {
    'referral': {
      'organization': "https://server.fire.ly/r5/Organization?_format=json",

    },
    'addClaim': {
      'encounter': "https:///hapi.fhir.org/baseR5/Encounter?_format=json"
    },

    'appointment': {
      'status': 'https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/appointmentstatus&_format=json',
      'appointmentType': 'https://tx.fhir.org/r5/CodeSystem?url=http://terminology.hl7.org/CodeSystem/v2-0276&_format=json',
      'serviceType': 'https://server.fire.ly/r5/HealthcareService?_format=json',
      'reason': "/dummy.json",
      'participantActor': 'https://server.fire.ly/r5/Practitioner?_format=json',
      'slot': 'https://server.fire.ly/r5/Slot?_format=json',

    },
    'slot': {
      'serviceType': 'https://server.fire.ly/r5/HealthcareService?_format=json',
      'appointmentType': 'https://tx.fhir.org/r5/CodeSystem?url=http://hl7.org/fhir/ValueSet/encounter-reason&_format=json',



    },
    'patient': {
      'gender': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender&_format=json",
      'maritalStatus': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/marital-status&_format=json",
      'relationship': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/patient-contactrelationship&_format=json",
      'general_practitioner': "https://tx.fhir.org/r5/Practitioner?_format=json",
      'contactPointUse': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-use&_format=json",
      'contactPointSystem': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/contact-point-system&_format=json",

    },

    'encounter': {
      'class': 'https://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v3-ActEncounterCode&_format=json',
      'priority': 'https://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v3-ActPriority&_format=json',
      'participant': 'https://elikita-server.daalitech.com/Practitioner?_format=json',
      'reason': "/dummy.json",
      'reason_use': 'https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/encounter-reason-use&_format=json'
    },
    'serviceRequest': {
      'status': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-status&_format=json",
      'intent': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-intent&_format=json",
      'priority': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-priority&_format=json",
      'code': "/dummy.json",
      'performerType': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/participant-role&_format=json",

    },
    'medication': {
      'medication': "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/763158003&_format=json",
      'status': "/medication/status.json",
      'intent': "/medication/intent.json",
      'performerType': "/medication/performerType.json",
      'reason': "/dummy.json",
      'code': "dummy.json"
    },
    'medication_dispense': {
      'status': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medicationdispense-status&_format=json",
      'subject': "https://server.fire.ly/r5/Patient?_format=json",
      'receiver': "https://server.fire.ly/r5/Patient?_format=json",
      'medication': "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/763158003&_format=json",

    },
    'medication_administration': {
      'status': "http://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-admin-status&_format=json",
      'medication': "/dummy.json",
      'subject': "https://server.fire.ly/r5/Patient?_format=json",
      "performer": "https://server.fire.ly/r5/Practitioner?_format=json",
      "request": "https://server.fire.ly/r5/MedicationRequest?_format=json"

    },
    'condition': {
      'code': "/dummy.json",
    },
    'specimen': {
      'status': "http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/specimen-status&_FORMAT=JSON",
      "type": "http://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v2-0487&_FORMAT=JSON",
      "subject": "https://server.fire.ly/r4/Patient",
      "collector": "/encounter/encounter_participant.json",
      "bodySite": "/dummy.json",
      "condition": "http://tx.fhir.org/r4/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/v2-0493&_FORMAT=JSON"
    },

    'admission': {
      // 'location': "https://hapi.fhir.org/baseR5/Location?_format=json",
      'location': "/fhir_location_bundle_100.json",
      'admitSource': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/encounter-admit-source&_format=json",
      'carePlanStatus': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-status&_format=json",
      'carePlanIntent': "https://server.fire.ly/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/care-plan-intent&_format=json",
      'ward': "/fhir_location_bundle_100.json",
      'room': "/fhir_location_bundle_100.json",
      'bed': "/fhir_location_bundle_100.json",
      //careplansUBJECT: "",
      //taskintent, task priority, task status, task code
      'taskIntent': "https://server.fire.ly/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/task-intent&_format=json",
      'taskPriority': "https://server.fire.ly/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-priority&_format=json",
      'taskStatus': "https://server.fire.ly/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/task-status&_format=json",
      'taskCode': "https://server.fire.ly/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/task-code&_format=json",


    },
    'observation': {
      practitioner: "/encounter/encounter_participant.json",
      category: "https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/observation-category&_format=json",
      code: "/dummy.json",
      category2: "/observation/observation_category.json",
      category3: "/observation/observation_category.json",
      category4: "/observation/observation_category.json",

    },
    'allergy': {
      clinicalStatus: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergyintolerance-clinical&_format=json",
      verificationStatus: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergyintolerance-verification&_format=json",
      type: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergy-intolerance-type&_format=json",
      // code: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergyintolerance-code&_format=json",
      category: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergy-intolerance-category&_format=json",
      // criticality: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergy-intolerance-criticality&_format=json",
      code: "dummy.json",
      manifestation: "dummy.json",
      //"https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/clinical-findings&_format=json",
      // severity: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/reaction-event-severity&_format=json",
      exposureRoute: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/route-codes&_format=json",
      // References
      // patient: "https://server.fire.ly/r5/Patient?_format=json",
      // recorder: "https://server.fire.ly/r5/Practitioner?_format=json",
      // asserter: "https://server.fire.ly/r5/Practitioner?_format=json",
      reactionSubstance: "dummy.json",
      // "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/substance-code&_format=json"


    },
    diagnosticReport: {
      'category': "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/diagnostic-service-sections&_format=json",
      code: "dummy.json",
      performer: "https://server.fire.ly/r5/Practitioner?_format=json",
      resultsInterpreter: "https://server.fire.ly/r5/Practitioner?_format=json",
      specimen: "https://hapi.fhir.org/baseR5/Specimen?_format=json",
      observation: "https://hapi.fhir.org/baseR5/Observation?_format=json",
      rawObservation: "https://hapi.fhir.org/baseR5/Observation?_format=json",
      rawSpecimen: "https://hapi.fhir.org/baseR5/Specimen?_format=json",
    },
    medicine: {
      'code': "dummy.json",
      "doseForm": "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-form-codes&_format=json",
      "ingredientItem": "dummy.json",
      "ingredientStrength": "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-ingredientstrength&_format=json"
    },
    immunization: {
      statusReason: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-status-reason&_format=json",
      vaccineCode: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/vaccine-code&_format=json",
      informationSource: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-origin&_format=json",
      site: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-site&_format=json",
      route: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-route&_format=json",
      reason: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-reason&_format=json",
      targetDisease: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/immunization-target-disease&_format=json"
    },

    chargeItemDef: {
      currency: "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/currencies&_format=json"
    }

  }

  baseFunctionToRetrieveValueset(value: any) {
    console.log(value);
    return value.expansion.contains.map((item: any) => {

      return `${item.code}$#$${item.display}$#$${item.system}`;
    });
  }

  valueSetToConcept(value: ValueSet | any) {
    const concepts: { code: string; display: string; system: string }[] = [];

    const expansion = value?.expansion?.contains ?? [];
    expansion.forEach((item: any) => {
      if (item?.code) {
        concepts.push({
          code: item.code ?? '',
          display: item.display ?? '',
          system: item.system ?? ''
        });
      }
    });

    if (!concepts.length && Array.isArray(value?.compose?.include)) {
      value.compose.include.forEach((include: any) => {
        const includeConcepts = include?.concept ?? [];
        includeConcepts.forEach((concept: any) => {
          if (concept?.code) {
            concepts.push({
              code: concept.code ?? '',
              display: concept.display ?? '',
              system: include?.system ?? concept?.system ?? ''
            });
          }
        });
      });
    }

    const system = concepts.length ? concepts[0].system : (expansion?.[0]?.system ?? value?.compose?.include?.[0]?.system ?? '');

    return {
      system,
      concept: concepts
    };
  }

  practitionerBundleToReferenceData(value: Bundle<Practitioner> | null = null): ReferenceDataType[] {
    if (!value?.entry?.length) {
      return [];
    }

    return value.entry
      .map((entry: BundleEntry<Practitioner>) => {
        const resource = entry.resource;
        if (!resource) {
          return null;
        }

        const identifier = resource.identifier?.[0]?.value;
        const id = resource.id ?? identifier ?? '';
        if (!id) {
          return null;
        }

        const reference = `${resource.resourceType ?? 'Practitioner'}/${id}`;
        const primaryName = resource.name?.[0];
        const display = primaryName?.text
          ?? [primaryName?.given?.join(' '), primaryName?.family].filter(Boolean).join(' ').trim()
          ?? resource.id
          ?? 'Unnamed Practitioner';

        return {
          reference,
          display,
          type: resource.resourceType ?? 'Practitioner'
        } as ReferenceDataType;
      })
      .filter((ref): ref is ReferenceDataType => !!ref?.reference);
  }

  baseFunctionToTurnPractitionerIntoReference(value: Bundle<Practitioner> | Bundle<Patient> | null = null) {
    let reference: Reference = {
      reference: "",
      display: ""
    };
    if (value === null || value === undefined) {
      return "";
    } else {
      return value?.entry?.map((item: BundleEntry<Practitioner> | BundleEntry<Patient>) => {
        if (item.hasOwnProperty('identifier')) {
          reference.reference = `Practitioner/${item.resource?.identifier?.[0]?.value}`;

        } else if (value.hasOwnProperty('id')) {
          reference.reference = `Practitioner/${value.id}`;
        }
        reference.display = item.resource?.name?.[0]?.family || 'Unknown Practitioner' + ' ' + (item.resource?.name?.[0]?.given?.join(' ') || '');
        // return reference;
        return `${reference.reference}$#$${reference.display}`;
      })
    }
  }

  //     } else if (value.hasOwnProperty('id')) {
  //       return `Practitioner/${value.id}`;
  //     }
  //     else {
  //       return "";
  //     }
  //   }
  // }

  retrieveCodeabeConcept(value: CodeableConcept | null = null) {
    if (value === null || value === undefined) {
      return "";
    } else {
      if (value.text) {
        return value.text;
      }
      if (value.coding?.[0]?.display) {
        return value.coding?.[0]?.display;
      }
      return value.coding?.[0]?.code ?? ''

    }
  }

  // statusReason, vaccineCode, informationSource, site, route, reason
  transformValues = {
    'referral': {
      'organization': (value: Bundle<HealthcareService>) => {
        return value.entry?.map((e: BundleEntry<HealthcareService>) => {
          const display = e.resource?.name || 'Unnamed Organization';
          const reference = "Organization/" + e.resource?.identifier?.[0]?.value;
          return reference + "$#$" + display;
        })
      }
    },
    'addClaim': {
      encounter: (value: Bundle<Encounter>) => {
        return value.entry?.map((e: BundleEntry<Encounter>) => {
          const display = "Encounter-" + (e.resource && e.resource.id ? e.resource.id : '') + (e.resource?.type?.[0]?.text ? " | " + e.resource?.type?.[0]?.text : '') + (e.resource?.subject?.display ? " | " + e.resource?.subject?.display : "");
          const reference = "Encounter/" + e.resource?.id;

          return reference + "$#$" + display
        })
      }
    },
    diagnosticReport: {
      category: this.baseFunctionToRetrieveValueset,
      observation: (val: any) => {
        return val;
      },
      specimen: (val: any) => {
        return val;
      },
      rawObservation: (val: any) => {
        return val;
      },
      rawSpecimen: (val: any) => {
        return val;
      },
      code: (val: any) => {
        return ["https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/report-codes&_format=json"]
      },
      performer: this.baseFunctionToTurnPractitionerIntoReference,
      resultsInterpreter: this.baseFunctionToTurnPractitionerIntoReference
    },

    "chargeItemDef": {
      currency: this.baseFunctionToRetrieveValueset
    },
    "immunization": {
      statusReason: this.baseFunctionToRetrieveValueset,
      vaccineCode: this.baseFunctionToRetrieveValueset,
      informationSource: this.baseFunctionToRetrieveValueset,
      site: this.baseFunctionToRetrieveValueset,
      route: this.baseFunctionToRetrieveValueset,
      reason: this.baseFunctionToRetrieveValueset,
      targetDisease: this.baseFunctionToRetrieveValueset
    },
    'condition': {
      code: (val: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/condition-code&_format=json";
      }
    },
    "medicine": {
      doseForm: this.baseFunctionToRetrieveValueset,
      ingredientStrength: this.baseFunctionToRetrieveValueset,
      ingredientItem: (val: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-codes&_format=json"


      },
      "code": (val: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-codes&_format=json"
      }
    },
    'allergy': {
      clinicalStatus: this.baseFunctionToRetrieveValueset,
      verificationStatus: this.baseFunctionToRetrieveValueset,
      type: this.baseFunctionToRetrieveValueset,
      category: this.baseFunctionToRetrieveValueset,
      exposureRoute: this.baseFunctionToRetrieveValueset,
      patient: (val: Bundle<Patient>) => {
        return val.entry?.map((e: BundleEntry<Patient>) => {
          const display = e.resource?.name?.[0].family || "unknown";
          const reference = "Patient/" + e.resource?.identifier?.[0].value;
          return reference + "$#$" + display
        })
      },
      code: (value: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/allergyintolerance-code&_format=json";
      },
      manifestation: (val: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/clinical-findings&_format=json";
      },
      reactionSubstance: (val: any) => {
        return "https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/substance-code&_format=json"
      }

    },
    'observation': {
      practitioner:

        (all: any) => {
          if (all.hasOwnProperty('system') && all.hasOwnProperty('property')) {
            all = {
              ...all, concept: all.concept.map((e: any) => {

                const system = all.system;
                return { ...e, system }


              })
            }
          } else {
            all = all
          }

          return all;
        },
      category: this.baseFunctionToRetrieveValueset,
      // (all: any) => {

      //   if (all.hasOwnProperty('system') && all.hasOwnProperty('property')) {
      //     all = {
      //       ...all, concept: all.concept.map((e: any) => {

      //         const system = all.system;
      //         return { ...e, system }


      //       })
      //     }
      //   } else {
      //     all = this.baseFunctionToRetrieveValueset;
      //   }
      //   // alert(JSON.stringify(all));
      //   return all;
      // },
      code:
        (all: any) => {
          // if (all.hasOwnProperty('system') && all.hasOwnProperty('property')) {
          //   all = {
          //     ...all, concept: all.concept.map((e: any) => {

          //       const system = all.system;
          //       return { ...e, system }


          //     })
          //   }
          // } else {
          //   all = all
          // }

          // return all;
          return ["https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/observation-codes&_format=json"]
        },

      category2:
        (all: any) => {

          all.concept = all.concept.filter((e: any) => {

            return e.display.toLowerCase().includes('vital')
              || e.display.toLowerCase().includes('exam')


          });

          return all;
        },
      category3:
        (all: any) => {

          all.concept = all.concept.filter((e: any) => {

            return e.display.toLowerCase().includes('exam')


          });

          return all;
        },

      category4:
        (all: any) => {

          all.concept = all.concept.filter((e: any) => {

            return e.display.toLowerCase().includes('laboratory')


          });

          return all;
        }



      ,

    },
    admission: {
      ward: (value: Bundle<Location>) => {
        return value.entry?.filter((entry: BundleEntry<Location>) => {
          // alert(this.retrieveCodeabeConcept(entry.resource?.form).toLowerCase());
          return this.retrieveCodeabeConcept(entry.resource?.form).toLowerCase().includes('ward');
        }).map((entry: BundleEntry<Location>) => {
          // alert(entry.resource?.name || 'Unnamed Location');
          const rd = {
            reference: `Location/${entry.resource?.identifier?.[0]?.value}`,
            display: entry.resource?.name || 'Unnamed Location'
          };
          return `${rd.reference}$#$${rd.display}$#$${entry.resource?.partOf?.display || ''}`;

        }) || []
      },

      room: (value: Bundle<Location>) => {
        return value.entry?.filter((entry: BundleEntry<Location>) => {
          return this.retrieveCodeabeConcept(entry.resource?.form).toLowerCase().includes('room');
        }).map((entry: BundleEntry<Location>) => {
          const rd = {
            reference: `Location/${entry.resource?.identifier?.[0]?.value}`,
            display: entry.resource?.name || 'Unnamed Location',
            partOf: entry.resource?.partOf?.display || ''
          };
          return `${rd.reference}$#$${rd.display}$#$${rd.partOf}`;

        }) || []
      },

      bed: (value: Bundle<Location>) => {
        return value.entry?.filter((entry: BundleEntry<Location>) => {
          return this.retrieveCodeabeConcept(entry.resource?.form).toLowerCase().includes('bed');
        }).map((entry: BundleEntry<Location>) => {
          const rd = {
            reference: `Location/${entry.resource?.identifier?.[0]?.value}`,
            display: entry.resource?.name || 'Unnamed Location',
            partOf: entry.resource?.partOf?.display || ''
          };
          return `${rd.reference}$#$${rd.display}$#$${rd.partOf}`;
        }) || []
      },


      location: (value: Bundle<Location>) => {
        return value.entry?.map((entry: BundleEntry<Location>) => {
          return {
            reference: `Location/${entry.resource?.identifier?.[0]?.value}`,
            display: entry.resource?.name || 'Unnamed Location'
          }
        }) || []
      },
      admitSource: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}$#$${item.display ?? ''}$#$${item.system ?? ''}`;
        }) || [];
      },
      carePlanStatus: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}`;
        }) || [];
      },
      carePlanIntent: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}`;
        }) || [];
      },
      taskCode: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}$#$${item.display ?? ''}$#$${item.system ?? ''}`;
        }) || [];
      },
      taskIntent: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}`;
        }) || [];
      },
      taskPriority: (value: ValueSet) => {

        return value.expansion?.contains?.map((item: any) => {
          // alert(item);
          return `${item.code ?? ''}`;
        }) || [];
      },
      taskStatus: (value: ValueSet) => {
        return value.expansion?.contains?.map((item: any) => {
          return `${item.code ?? ''}`;
        }) || [];
      },
    },
    encounter: {
      class: (value: ValueSet) => {
        return this.valueSetToConcept(value);
      },
      priority: (value: ValueSet) => {
        return this.valueSetToConcept(value);
      },
      participant: (value: Bundle<Practitioner>) => {
        return this.practitionerBundleToReferenceData(value);
      },
      reason: (_value: any) => {
        // alert('encounter reason called');
        return ['https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/encounter-reason&_format=json'];
      },
      reason_use: (_value: any) => {
        return [
          "CC$#$Chief Complaint$#$http://hl7.org/fhir/encounter-reason-use",
          "HC$#$Health Concern$#$http://hl7.org/fhir/encounter-reason-use",
          "AD$#$Admitting Diagnosis$#$http://hl7.org/fhir/encounter-reason-use",
          "RV$#$Reason for Visit$#$http://hl7.org/fhir/encounter-reason-use",
          "HM$#$Health Maintenance$#$http://hl7.org/fhir/encounter-reason-use"
        ];

      }

    },
    appointment: {
      'status': (val: ValueSet) => {
        return val.expansion?.contains?.map((e: any) => {
          return e.code
        }) || []
      },
      appointmentType: (val: Bundle<CodeSystem>) => {
        console.log(val.entry, 'Slot Appointmenttype')

        const originalConceptArray = val.entry?.[0]?.resource?.concept?.map((cc => {
          console.log(cc);
          return `${cc.display}$#$${cc.code}`
        })) || []
        originalConceptArray?.push('Others');
        return originalConceptArray;

      },
      'participantActor': (val: Bundle<Practitioner>) => {
        const allRef = val.entry?.map((serviceType: BundleEntry<Practitioner>) => {
          const ref = `Practitioner/${serviceType.resource?.id}`
          // alert(ref);
          const display = `${serviceType.resource?.name?.[0]?.given?.join(" ")} ${serviceType.resource?.name?.[0]?.family} `
          // alert(display);
          const Referenced: Reference = {
            reference: ref,
            display
          }
          return `${Referenced.reference}$#$${Referenced.display}`
        }) || []
        //    alert(allRef.join(" "))
        return [...allRef, 'Others']



      },
      serviceType: (val: Bundle<HealthcareService>) => {
        const allRef = val.entry?.map((serviceType: BundleEntry<HealthcareService>) => {
          const ref = `HealthcareService/${serviceType.resource?.id}`
          const display = serviceType.resource?.name ?? 'UnLabeled Service'
          const Referenced: Reference = {
            reference: ref,
            display
          }
          return `${Referenced.reference}$#$${Referenced.display}`
        }) || []
        return [...allRef, 'Others']


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

    slot: {
      serviceType: (val: Bundle<HealthcareService>) => {
        const allRef = val.entry?.map((serviceType: BundleEntry<HealthcareService>) => {
          const ref = `HealthcareService/${serviceType.resource?.id}`
          const display = serviceType.resource?.name ?? 'UnLabeled Service'
          const Referenced: Reference = {
            reference: ref,
            display
          }
          return `${Referenced.reference}$#$${Referenced.display}`
        }) || []
        return [...allRef, 'Others']


      },

      appointmentType: (val: Bundle<CodeSystem>) => {
        console.log(val.entry, 'Slot Appointmenttype')

        const originalConceptArray = val.entry?.[0]?.resource?.concept?.map((cc => {
          console.log(cc);
          return `${cc.display}$#$${cc.code}`
        })) || []
        originalConceptArray?.push('Others');
        return originalConceptArray;

      }

    },
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
        return value.entry?.filter((e: any) => {
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
        return ['http://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-codes&_format=json']
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
      'code': (value: any) => {
        return ['https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-codes&_format=json']
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
        return throwError(() => new Error('No url exists for the given field paths: ' + JSON.stringify(fieldPaths)));
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
