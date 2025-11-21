import { Injectable } from '@angular/core';

export interface FhirReference {
    reference: string;
    display?: string;
}

export interface FhirCoding {
    system?: string;
    code: string;
    display?: string;
}

export interface FhirCodeableConcept {
    coding?: FhirCoding[];
    text?: string;
}

export type PropertyKind =
    'CodeableConcept' |
    'Reference' |
    'CodeableConcept[]' |
    'Reference[]' |
    'string' |
    'string[]' |
    'primitive';

export interface BackboneProperty {
    kind: 'BackboneElement';
    fields: ResourcePropertyMap;
    isArray?: boolean;
}

export type ResourcePropertyMap = Record<string, PropertyKind | BackboneProperty>;
export type ResourcePropertyRegistry = Record<string, ResourcePropertyMap>;

export const isBackboneProperty = (value: any): value is BackboneProperty =>
    !!value && typeof value === 'object' && value.kind === 'BackboneElement';

const backbone = (fields: ResourcePropertyMap, isArray = false): BackboneProperty => ({
    kind: 'BackboneElement',
    fields,
    isArray
});

// Minimal mapping (extend as needed)
export const RESOURCE_PROPERTY_TYPES: ResourcePropertyRegistry = {
    Patient: {
        gender: 'string',
        maritalStatus: 'CodeableConcept',
        communication: 'CodeableConcept[]',
        generalPractitioner: 'Reference[]'
    },
    Encounter: {
        type: 'CodeableConcept[]',
        class: 'CodeableConcept',
        priority: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        reasonReference: 'Reference[]',
        subject: 'Reference',
        participant: 'Reference[]'
    },
    Observation: {
        category: 'CodeableConcept[]',
        code: 'CodeableConcept',
        bodySite: 'CodeableConcept',
        method: 'CodeableConcept',
        focus: 'Reference[]',
        subject: 'Reference',
        performer: 'Reference[]',
        component: backbone({
            code: 'CodeableConcept',
            valueQuantity: 'primitive',
            valueString: 'string',
            valueCodeableConcept: 'CodeableConcept',
            interpretation: 'CodeableConcept[]'
        }, true),
        'component.code': 'CodeableConcept',
        'component.valueQuantity': 'primitive',
        'component.valueString': 'string',
        'component.valueCodeableConcept': 'CodeableConcept',
        'component.interpretation': 'CodeableConcept[]'
    },
    ServiceRequest: {
        status: 'string',
        intent: 'string',
        priority: 'string',
        code: 'CodeableConcept',
        category: 'CodeableConcept[]',
        reasonCode: 'CodeableConcept[]',
        requester: 'Reference',
        subject: 'Reference',
        performer: 'Reference[]',
        performerType: 'CodeableConcept',
        orderDetail: backbone({
            parameterCodeableConcept: 'CodeableConcept',
            parameterString: 'string',
            parameterQuantity: 'primitive'
        }, true),
        'orderDetail.parameterCodeableConcept': 'CodeableConcept',
        'orderDetail.parameterString': 'string',
        'orderDetail.parameterQuantity': 'primitive'
    },
    MedicationRequest: {
        status: 'string',
        intent: 'string',
        medicationCodeableConcept: 'CodeableConcept',
        medicationReference: 'Reference',
        subject: 'Reference',
        reasonCode: 'CodeableConcept[]',
        reasonReference: 'Reference[]',
        performerType: 'CodeableConcept',
        requester: 'Reference',
        dosageInstruction: backbone({
            text: 'string',
            additionalInstruction: 'CodeableConcept[]',
            patientInstruction: 'string',
            timing: 'primitive',
            route: 'CodeableConcept',
            method: 'CodeableConcept',
            doseAndRate: 'primitive'
        }, true),
        'dosageInstruction.text': 'string',
        'dosageInstruction.additionalInstruction': 'CodeableConcept[]',
        'dosageInstruction.patientInstruction': 'string',
        'dosageInstruction.timing': 'primitive',
        'dosageInstruction.route': 'CodeableConcept',
        'dosageInstruction.method': 'CodeableConcept',
        'dosageInstruction.doseAndRate': 'primitive'
    },
    AllergyIntolerance: {
        clinicalStatus: 'CodeableConcept',
        verificationStatus: 'CodeableConcept',
        type: 'string',
        category: 'string[]',
        code: 'CodeableConcept',
        patient: 'Reference',
        recorder: 'Reference',
        asserter: 'Reference',
        reaction: 'CodeableConcept[]'
    },
    Immunization: {
        vaccineCode: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        patient: 'Reference',
        location: 'Reference',
        site: 'CodeableConcept',
        route: 'CodeableConcept'
    },
    DiagnosticReport: {
        category: 'CodeableConcept[]',
        code: 'CodeableConcept',
        subject: 'Reference',
        performer: 'Reference[]',
        resultsInterpreter: 'Reference[]'
    },
    Appointment: {
        status: 'string',
        appointmentType: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        participant: 'Reference[]',
        serviceType: 'CodeableConcept[]'
    },
    Location: {
        type: 'CodeableConcept[]'
    },
    Practitioner: {
        qualification: 'CodeableConcept[]'
    },
    Medication: {
        code: 'CodeableConcept',
        form: 'CodeableConcept',
        ingredient: 'CodeableConcept[]'
    },
    Specimen: {
        type: 'CodeableConcept',
        subject: 'Reference',
        collection: backbone({
            collector: 'Reference',
            collectedDateTime: 'string',
            bodySite: 'CodeableConcept',
            method: 'CodeableConcept',
            quantity: 'primitive'
        }),
        'collection.collector': 'Reference',
        'collection.collectedDateTime': 'string',
        'collection.bodySite': 'CodeableConcept',
        'collection.method': 'CodeableConcept',
        'collection.quantity': 'primitive',
        request: 'Reference[]',
        condition: 'CodeableConcept[]',
        note: 'string[]'
    },
    Task: {
        status: 'string',
        intent: 'string',
        code: 'CodeableConcept',
        focus: 'Reference'
    },
    CarePlan: {
        status: 'string',
        intent: 'string',
        category: 'CodeableConcept[]',
        subject: 'Reference'
    },
    ChargeItemDefinition: {
        code: 'CodeableConcept[]'
    },
    Slot: {
        serviceType: 'CodeableConcept[]'
    },
    Condition: {
        code: 'CodeableConcept',
        category: 'CodeableConcept[]',
        subject: 'Reference',
        stage: backbone({
            summary: 'CodeableConcept',
            assessment: 'Reference[]',
            type: 'CodeableConcept'
        }, true),
        'stage.summary': 'CodeableConcept',
        'stage.assessment': 'Reference[]',
        'stage.type': 'CodeableConcept'
    }
};

@Injectable({
    providedIn: 'root'
})
export class FhirResourceTransformService {

    transformValues(
        resourceType: string,
        data: Record<string, any>,
        passthrough: string[] = []
    ): Record<string, any> {
        const result: Record<string, any> = {};
        const typeMap = RESOURCE_PROPERTY_TYPES[resourceType] || {};
        Object.entries(data).forEach(([key, value]) => {
            if (passthrough.includes(key)) {
                result[key] = value;
                return;
            }
            const configEntry = typeMap[key];
            if (isBackboneProperty(configEntry)) {
                result[key] = this.transformBackbone(value, configEntry);
            } else if (configEntry) {
                result[key] = this.applyKindTransform(value, configEntry as PropertyKind);
            } else {
                const inferred = this.inferKind(value);
                result[key] = this.applyKindTransform(value, inferred);
            }
        });
        return result;
    }

    transformResource(
        resource: { resourceType?: string } & Record<string, any>,
        passthrough: string[] = []
    ): Record<string, Record<string, any>> {
        if (!resource?.resourceType) return {};
        const { resourceType, ...payload } = resource;
        return {
            [resourceType]: this.transformValues(resourceType, payload, passthrough)
        };
    }

    public inferKind(value: any): PropertyKind {
        if (Array.isArray(value)) return 'string[]';
        if (typeof value === 'string') return 'string';
        return 'primitive';
    }

    private transformBackbone(value: any, config: BackboneProperty): any {
        if (value == null) return value;
        if (config.isArray) {
            return this.ensureArray(value).map(item => this.transformBackboneFields(item, config.fields));
        }
        if (typeof value !== 'object') return value;
        return this.transformBackboneFields(value, config.fields);
    }

    private transformBackboneFields(value: Record<string, any>, fields: ResourcePropertyMap): Record<string, any> {
        const result: Record<string, any> = {};
        Object.entries(value || {}).forEach(([childKey, childVal]) => {
            const childConfig = fields[childKey];
            if (isBackboneProperty(childConfig)) {
                result[childKey] = this.transformBackbone(childVal, childConfig);
            } else if (childConfig) {
                result[childKey] = this.applyKindTransform(childVal, childConfig as PropertyKind);
            } else {
                result[childKey] = childVal;
            }
        });
        return result;
    }

    private applyKindTransform(value: any, kind: PropertyKind): any {
        switch (kind) {
            case 'CodeableConcept': return this.toCodeableConcept(value);
            case 'CodeableConcept[]': return this.ensureArray(value).map(v => this.toCodeableConcept(v));
            case 'Reference': return this.toReference(value);
            case 'Reference[]': return this.ensureArray(value).map(v => this.toReference(v));
            case 'string': return value;
            case 'string[]': return this.ensureArray(value);
            default: return value;
        }
    }

    public ensureArray(v: any): any[] {
        return Array.isArray(v) ? v : (v == null ? [] : [v]);
    }

    public toCodeableConcept(raw: any): FhirCodeableConcept | any {
        if (!raw) return raw;
        if (typeof raw === 'object' && (raw.display || raw.code || raw.text)) {
            if(!raw.code && !raw.display && raw.text){
            return {text: raw.text}
            }
            if(raw.code || raw.display){
return {
    text: raw.text || raw.display || raw.code,
    coding: [
        {
            code: raw.code || raw.display,
            display: raw.display || raw.code,
            system: raw.system || 'https://elikita-server.daalitech.com'


        }
    ]
}
            
        }}
    
        // if (typeof raw !== 'string') return { text: String(raw) };
        const parts = raw.split('$#$').map((p:any) => p.trim());
        if (parts.length === 3 && this.allPartsHaveValue(parts)) {
            const [code, display, system] = parts;
            return { coding: [{ code, display, system }], text: display };
        }
        if (parts.length === 2 && this.allPartsHaveValue(parts)) {
            const [code, display] = parts;
            return { coding: [{ code, display }], text: display };
        }
        return { text: raw };
    }

    public toReference(raw: any): FhirReference | any {
        if (!raw) return raw;
        if (typeof raw === 'object' && raw.reference) return raw;
        if (typeof raw !== 'string') return raw;
        const parts = raw.split('$#$').map(p => p.trim());
        if (parts.length === 2 && this.allPartsHaveValue(parts)) {
            const [reference, display] = parts;
            return { reference, display };
        }
        // Pattern ResourceType/id [optional display after space]
        const firstSpace = raw.indexOf(' ');
        const candidate = firstSpace === -1 ? raw : raw.substring(0, firstSpace);
        if (/^[A-Z][A-Za-z]+\/[A-Za-z0-9\-.]+$/.test(candidate)) {
            const display = firstSpace === -1 ? undefined : raw.substring(firstSpace + 1).trim() || undefined;
            return { reference: candidate, ...(display ? { display } : {}) };
        }
        return raw; // fallback
    }

    private allPartsHaveValue(parts: string[]): boolean {
        return parts.every(p => p !== '');
    }
}
