import { TitleCasePipe } from '@angular/common';
import { Component, Inject, Input, Optional, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Bundle, Organization } from 'fhir/r5';
import { DetailsCardzComponent } from '../details-cardz/details-cardz.component';
import { SpecialHeaderComponent } from '../shared/special-header/special-header.component';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { UtilityService } from '../shared/utility.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { HospitalService } from './hospital.service';
import { ErrorService } from '../shared/error.service';

@Component({
  selector: 'app-hospital-details',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatDividerModule, TitleCasePipe, SpecialHeaderComponent, DetailsCardzComponent],
  templateUrl: './hospital-details.component.html',
  styleUrls: ['./hospital-details.component.scss']
})

export class HospitalDetailsComponent {
  // Services & injections
  linkInReferences = inject(LinkInReferencesService);
  http = inject(HttpClient);
  utilityService = inject(UtilityService);
  route = inject(ActivatedRoute);
  auth = inject(AuthService);
  encounterService = inject(EncounterServiceService);
  hosServ = inject(HospitalService);
  snackBar = inject(MatSnackBar);
  errorService = inject(ErrorService);

  // State
  realHospitalDetails?: Organization & { [key: string]: any };
  @Input() hospitalDetailsFromInput?: Bundle;
  patientId: string | null = null;
  user: any = null;
  capacityObject = capacityObject;

  // Builder used by DetailsCardzComponent
  detailsBuilderObject: any = {
    resourceName: 'Hospital',
    resourceIcon: 'local_hospital',
    specialHeader: {
      specialHeaderKey: 'name',
      specialHeaderIcon: 'local_hospital',
      specialHeaderDataType: 'string',
      ReferenceDeepPath: null,
      valueDeepPath: null,
    },
    groups: [
      // {
      //   groupName: 'Contact',
      //   groupIcon: 'contact_phone',
      //   groupMembers: [

      //   ],
      // },
      {
        groupName: 'Details',
        groupIcon: 'info',
        groupMembers: [
          { key: 'name', label: 'Name', keyDataType: 'string', referenceDeepPath: null, valueDeepPath: null },
          { key: 'alias', label: 'Alias', keyDataType: 'string', referenceDeepPath: null, valueDeepPath: ['0'].join('$#$') },
          { key: 'type', label: 'Type', keyDataType: 'CodeableConcept', referenceDeepPath: null, valueDeepPath: [0] },
          { key: 'description', label: 'Description', keyDataType: 'string', referenceDeepPath: null, valueDeepPath: null },
          { key: 'qualification', label: 'Qualification Code', keyDataType: 'CodeableConcept', referenceDeepPath: null, valueDeepPath: ['0', 'code'].join('$#$') },
          // Top-level telecom entries will be dynamically appended here
        ],
      },
      {
        groupName: 'Phone',
        groupIcon: 'phone',
        groupMembers: []
      },
      {
        groupName: 'Email',
        groupIcon: 'email',
        groupMembers: []
      },
      {
        groupName: 'Other Contacts',
        groupIcon: 'contacts',
        groupMembers: []
      },
      {
        groupName: 'Addresses',
        groupIcon: 'location_on',
        grouped: true, // hint for renderer that items are grouped by index prefix
        groupMembers: [] // will be dynamically populated with addressN_* entries
      },

    ],
  };

  // Attempt optional dialog data injection without parameter decorators
  hospitalDetailsFromDialog: any = (() => { try { return inject(MAT_DIALOG_DATA); } catch { return null; } })();

  ngOnInit() {
    // Capture user/testing state
    this.auth.user.subscribe((user) => {
      this.user = user;
      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' };
        this.patientId = '100001';
        this.capacityObject['labRequest']['request'].push('testing');
      }
    });

    // Load organization resources from remote Elikita FHIR server instead of local stub
    const orgUrl = 'https://elikita-server.daalitech.com/Organization';
    this.http.get<Bundle<Organization>>(orgUrl, { headers: { 'Accept': 'application/fhir+json' } }).subscribe({
      next: (bundle: Bundle<Organization>) => {
        // Prefer first entry unless dialog/input provided overrides
        const firstOrg = bundle.entry?.[0]?.resource as Organization | undefined;
        this.realHospitalDetails = this.hospitalDetailsFromInput || this.hospitalDetailsFromDialog || firstOrg;

        if (!this.realHospitalDetails) {
          this.snackBar.open('No organization resource found on server', 'Close', { duration: 4000 });
          return;
        }

        // 1. Contact telecom (iterate all contacts)
        const contactGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Contact');
        if (contactGroup && this.realHospitalDetails.contact?.length) {
          this.realHospitalDetails.contact.forEach((contact: any, cIdx: number) => {
            if (!contact?.telecom?.length) return;
            const perSystemCounter: Record<string, number> = {};
            contact.telecom.forEach((tele: any, tIdx: number) => {
              const sys = tele.system || 'other';
              perSystemCounter[sys] = (perSystemCounter[sys] || 0) + 1;
              contactGroup.groupMembers.push({
                key: 'contact',
                label: `contact${cIdx + 1}_${sys}_${perSystemCounter[sys]}`,
                keyDataType: 'string',
                referenceDeepPath: null,
                valueDeepPath: [String(cIdx), 'telecom', String(tIdx), 'value'].join('$#$'),
              });
            });
          });
        }

        // 2. Top-level organization telecom array
        const detailsGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Details');
        if (detailsGroup && (this.realHospitalDetails as any)['telecom']?.length) {
          const counters: Record<string, number> = {};
          ((this.realHospitalDetails as any)['telecom'] as any[]).forEach((tele: any, idx: number) => {
            const sys = tele.system || 'other';
            counters[sys] = (counters[sys] || 0) + 1;
            detailsGroup.groupMembers.push({
              key: 'telecom',
              label: `${sys}_${counters[sys]}`,
              keyDataType: 'string',
              referenceDeepPath: null,
              valueDeepPath: [String(idx), 'value'].join('$#$'),
            });
          });
        }

        // 2b. Populate the dedicated 'phone' group with only phone-type telecom entries
        const phoneGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Phone');
        if (phoneGroup && (this.realHospitalDetails as any)['telecom']?.length) {
          phoneGroup.groupMembers = [];
          let phoneCounter = 0;
          ((this.realHospitalDetails as any)['telecom'] as any[]).forEach((tele: any, idx: number) => {
            const sys = (tele.system || '').toString().toLowerCase();
            if (sys === 'phone') {
              phoneCounter += 1;
              phoneGroup.groupMembers.push({
                key: 'telecom',
                label: `Phone ${phoneCounter}`,
                keyDataType: 'phone',
                referenceDeepPath: null,
                valueDeepPath: [String(idx), 'value'].join('$#$'),
              });
            }
          });
        }

        // 2c. Populate the dedicated 'email' group with only email-type telecom entries
        const emailGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Email');
        if (emailGroup && (this.realHospitalDetails as any)['telecom']?.length) {
          emailGroup.groupMembers = [];
          let emailCounter = 0;
          ((this.realHospitalDetails as any)['telecom'] as any[]).forEach((tele: any, idx: number) => {
            const sys = (tele.system || '').toString().toLowerCase();
            if (sys === 'email') {
              emailCounter += 1;
              emailGroup.groupMembers.push({
                key: 'telecom',
                label: `Email ${emailCounter}`,
                keyDataType: 'email',
                referenceDeepPath: null,
                valueDeepPath: [String(idx), 'value'].join('$#$'),
              });
            }
          });
        }

        // 2d. Populate 'Other contacts' with telecom systems excluding phone & email
        const otherGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Other Contacts');
        if (otherGroup && (this.realHospitalDetails as any)['telecom']?.length) {
          otherGroup.groupMembers = [];
          ((this.realHospitalDetails as any)['telecom'] as any[]).forEach((tele: any, idx: number) => {
            const rawSys = tele.system || 'other';
            const sysLower = rawSys.toString().toLowerCase();
            if (sysLower !== 'phone' && sysLower !== 'email') {
              otherGroup.groupMembers.push({
                key: 'telecom',
                label: rawSys, // label is just the telecom system type
                keyDataType: 'string',
                referenceDeepPath: null,
                valueDeepPath: [String(idx), 'value'].join('$#$'),
              });
            }
          });
        }

        // 3. Enumerate all Organization.address entries in Organization Address group
        const addrGroup = this.detailsBuilderObject.groups.find((g: any) => g.groupName === 'Addresses');
        if (addrGroup) {
          addrGroup.groupMembers = [];
          const addresses = ((this.realHospitalDetails as any)['address'] as any[]) ?? [];
          addresses.forEach((addr: any, idx: number) => {
            const base = `address${idx + 1}`;
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} summary`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'text'].join('$#$')
            });
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} line`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'line'].join('$#$')
            });
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} city`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'city'].join('$#$')
            });
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} state`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'state'].join('$#$')
            });
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} postalCode`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'postalCode'].join('$#$')
            });
            addrGroup.groupMembers.push({
              key: 'address', label: `${base} country`, keyDataType: 'string', referenceDeepPath: null,
              valueDeepPath: [String(idx), 'country'].join('$#$')
            });
          });
        }

        // 4. For each ExtendedContactDetail (Organization.contact), add a dedicated dynamic group
        const contacts = this.realHospitalDetails.contact ?? [];
        if (Array.isArray(contacts) && contacts.length) {
          contacts.forEach((ct: any, cIdx: number) => {
            const contactGroupDyn: any = {
              groupName: `Contact ${cIdx + 1}`,
              groupIcon: 'person',
              groupMembers: [] as any[]
            };

            // purpose (CodeableConcept)
            if (ct?.purpose) {
              contactGroupDyn.groupMembers.push({
                key: 'contact',
                label: 'purpose',
                keyDataType: 'CodeableConcept',
                referenceDeepPath: null,
                valueDeepPath: [String(cIdx), 'purpose', 'text'].join('$#$'),
              });
            }

            // name (HumanName)
            if (ct?.name) {
              // Prefer name.text if present; renderer will resolve path from key 'contact'
              contactGroupDyn.groupMembers.push({
                key: 'contact',
                label: 'name',
                keyDataType: 'string',
                referenceDeepPath: null,
                valueDeepPath: [String(cIdx), 'name', 'text'].join('$#$'),
              });
            }

            // telecom (ContactPoint[]) - flatten phone and email only
            if (Array.isArray(ct?.telecom) && ct.telecom.length) {
              let phoneN = 0; let emailN = 0;
              ct.telecom.forEach((tp: any, tIdx: number) => {
                const sys = (tp?.system || '').toString().toLowerCase();
                if (sys === 'phone') {
                  phoneN += 1;
                  contactGroupDyn.groupMembers.push({
                    key: 'contact',
                    label: `telecom phone ${phoneN}`,
                    keyDataType: 'phone',
                    referenceDeepPath: null,
                    valueDeepPath: [String(cIdx), 'telecom', String(tIdx), 'value'].join('$#$'),
                  });
                } else if (sys === 'email') {
                  emailN += 1;
                  contactGroupDyn.groupMembers.push({
                    key: 'contact',
                    label: `telecom email ${emailN}`,
                    keyDataType: 'email',
                    referenceDeepPath: null,
                    valueDeepPath: [String(cIdx), 'telecom', String(tIdx), 'value'].join('$#$'),
                  });
                }
              });
            }

            // Add the dynamic contact group only if there is at least one member
            if (contactGroupDyn.groupMembers.length) {
              this.detailsBuilderObject.groups.push(contactGroupDyn);
            }
          });
        }
      },
      error: (err) => {
        console.error('Failed to load Organization resources:', err);
        this.errorService.openandCloseError('Failed to load organization details');
        this.snackBar.open('Error loading organization details', 'Close', { duration: 5000, panelClass: ['snackbar-error'] });
      }
    });
  }
}
