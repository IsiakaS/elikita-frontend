import { Injectable, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FhirResourceTransformService, RESOURCE_PROPERTY_TYPES, PropertyKind, BackboneProperty, isBackboneProperty } from '../shared/fhir-resource-transform.service';
import { Resource } from 'fhir/r4';

/**
 * TODO (FHIR resource integration checklist):
 * 1. Identify the FHIR R4 resource name in scope.
 * 2. Inspect the entire component displaying the resource table.
 * 3. Search that component for an “add ${resource}” button.
 * 4. Trace which function the button triggers.
 * 5. If no button, review EncounterService for an add<Resource>() equivalent.
 * 6. Validate the add function’s form fields against FHIR datatypes (pre-fill, hide, remove, add, requisition/groupIdentifier considerations).
 * 7. Ensure dropdown data sources call real endpoints suitable for each field type.
 * 8. Correct any mismatches uncovered above.
 * 9. Confirm whether bulk-add is needed (mirroring EncounterService addServiceRequest/addMedicineRequest patterns and components).
 * 10. Verify where form values are collected; create the mechanism if missing.
 * 11. Define and enforce required fields with validation at submission.
 * 12. Use FhirResourceTransformService.transform() to map data into FHIR format.
 * 13. Console-check the mapped resource payload.
 * 14. Submit the finalized resource.
 */
@Injectable({
  providedIn: 'root'
})
export class DetailsBuilderService extends FhirResourceTransformService implements OnChanges {
@Input()resourceData?: Resource;
@Input()detailsBuilderObject?: DetailsBuilderObject 
  constructor() {
    super();
  }
  refinedResourceData: Record<string, any> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!('resourceData' in changes) || !this.resourceData?.resourceType) return;

    const { resourceType, ...payload } = this.resourceData as Resource & Record<string, any>;
    this.refinedResourceData = this.stringifyResource(
      resourceType,
      payload,
    
    );
  }





//  detailsBuilderObject = {
//     resourceName: "Low Supply Detail",
//     resourceIcon: 'inventory_2',
//     specialHeader: {
//       specialHeaderKey: 'code',
//       specialHeaderIcon: 'inventory_2',
//       specialHeaderDataType: 'CodeableConcept',
//       ReferenceDeepPath: null, // ['name', '0'].join('$#$');
//       valueDeepPath: null,

//     },
//     groups: [{
//       groupName: 'Details',
//       groupIcon: 'info',
//       groupMembers: [

//         //name
//         {
//           key: 'code',
//           label: 'Name',
//           keyDataType: 'string',
//           referenceDeepPath: null,
//           valueDeepPath: ['coding', '0', 'display'].join('$#$'),
//         },
//         //alias
//         {
//           key: 'category',
//           label: 'Category',
//           keyDataType: 'CodeableConcept',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },
//         {
//           key: 'netContent',
//           label: 'In Stock',
//           keyDataType: 'number',
//           referenceDeepPath: null,
//           valueDeepPath: ['value'].join('$#$'),
//         },
//         {
//           key: 'baseUnit',
//           label: 'Base Unit',
//           keyDataType: 'CodeableConcept',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },

//         {
//           key: 'inStockStatus',
//           label: 'Quantity in Stock',
//           keyDataType: 'IndividualField',
//           referenceDeepPath: null,
//           valueDeepPath: null,
//         },

//       ]
//     }]
//   };

  stringifyResource(
    resourceType: string,
    data: Record<string, any>
  ): Record<string, string> {
    const typeMap = RESOURCE_PROPERTY_TYPES[resourceType] || {};
    const result: Record<string, string> = {};

    Object.entries(data || {}).forEach(([key, value]) => {
      const configEntry = typeMap[key];
      if (isBackboneProperty(configEntry)) {
        result[key] = this.stringifyBackboneValue(value);
        this.flattenBackboneFields(result, key, value, configEntry);
        return;
      }
      const kind = (configEntry as PropertyKind) || this.inferKind(value);
      result[key] = this.stringifyValue(value, kind);
    });

    return result;
  }

  private stringifyBackboneValue(value: any): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private flattenBackboneFields(
    bucket: Record<string, string>,
    prefix: string,
    value: any,
    config: BackboneProperty
  ): void {
    if (value == null) return;
    const entries = config.isArray ? this.ensureArray(value) : [value];
    entries.forEach((entry, index) => {
      const currentPrefix = config.isArray ? `${prefix}[${index}]` : prefix;
      Object.entries(config.fields).forEach(([childKey, childConfig]) => {
        const childValue = entry?.[childKey];
        if (childValue == null) return;
        const dottedKey = `${currentPrefix}.${childKey}`;
        if (isBackboneProperty(childConfig)) {
          bucket[dottedKey] = this.stringifyBackboneValue(childValue);
          this.flattenBackboneFields(bucket, dottedKey, childValue, childConfig);
        } else {
          const kind = (childConfig as PropertyKind) || this.inferKind(childValue);
          bucket[dottedKey] = this.stringifyValue(childValue, kind);
        }
      });
    });
  }

  private stringifyValue(value: any, kind: PropertyKind): string {
    if (value == null) return '';
    switch (kind) {
      case 'CodeableConcept': 
        return this.stringifyConcept(value);
      case 'CodeableConcept[]':
        return this.ensureArray(value).map(v => this.stringifyConcept(v)).filter(Boolean).join(', ');
      case 'Reference':
        return this.stringifyReference(value);
      case 'Reference[]':
        return this.ensureArray(value).map(v => this.stringifyReference(v)).filter(Boolean).join(', ');
      case 'string':
        return String(value);
      case 'string[]':
        return this.ensureArray(value).join(', ');
      default:
        return this.stringifyAnyValue(value);
    }
  }

  private stringifyAnyValue(value: any): string {
    if (value == null) return '';
    if (Array.isArray(value)) {
      return value.map(v => this.stringifyAnyValue(v)).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      if (this.isQuantityLike(value)) return this.stringifyQuantity(value);
      if (this.isRangeLike(value)) return this.stringifyRange(value);
      if (this.isPeriodLike(value)) return this.stringifyPeriod(value);
      if (value.reference || value.display) return this.stringifyReference(value);
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  private isQuantityLike(value: any): boolean {
    return typeof value === 'object' && value !== null && ('value' in value) && ('unit' in value || 'code' in value);
  }

  private stringifyQuantity(value: any): string {
    const magnitude = value.value ?? value.numerator?.value ?? '';
    const unit = value.unit ?? value.code ?? value.numerator?.unit ?? '';
    if (magnitude === '' && unit === '') return '';
    return `${magnitude}${unit ? ` ${unit}` : ''}`.trim();
  }

  private isRangeLike(value: any): boolean {
    return typeof value === 'object' && value !== null && ('low' in value || 'high' in value);
  }

  private stringifyRange(value: any): string {
    const low = value.low ? this.stringifyQuantity(value.low) : '';
    const high = value.high ? this.stringifyQuantity(value.high) : '';
    return [low, high].filter(Boolean).join(' – ');
  }

  private isPeriodLike(value: any): boolean {
    return typeof value === 'object' && value !== null && ('start' in value || 'end' in value);
  }

  private stringifyPeriod(value: any): string {
    const start = value.start ? new Date(value.start).toLocaleString() : '';
    const end = value.end ? new Date(value.end).toLocaleString() : '';
    return [start, end].filter(Boolean).join(' → ');
  }

  private stringifyConcept(concept: any): string {
    if (!concept) return '';
    if (typeof concept === 'string') return concept;
    const coding = this.ensureArray(concept?.coding)[0];
    return concept.text || coding?.display || coding?.code || '';
  }

  private stringifyReference(ref: any): string {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    return ref.display || ref.reference || '';
  }
}

export interface DetailsBuilderObject {
  resourceName: string;
  resourceIcon: string;
  specialHeader: {
    strongSectionKey: string;
    iconSectionKeys: string[];
    contentSectionKeys: string[];
  };
  groups: {
    groupName: string;
    groupIcon: string;
    groupKeys: string[];
  }[]
otherKeys?: string[];
  }