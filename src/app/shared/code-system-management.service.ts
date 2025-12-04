import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { CodeSystem, ValueSet, Bundle } from 'fhir/r4';
import { backendEndPointToken } from '../app.config';
import { StateService } from './state.service';
import { ErrorService } from './error.service';

/**
 * Service for managing CodeSystem concepts and their active status
 * Handles operations like:
 * - Toggling active/inactive status for individual concepts
 * - Batch activating/deactivating multiple concepts
 * - Updating CodeSystem resources with proper versioning
 * - Regenerating ValueSets after concept status changes
 * - Validating concept modifications
 */
@Injectable({
  providedIn: 'root'
})
export class CodeSystemManagementService {
  private http = inject(HttpClient);
  private backendUrl = inject(backendEndPointToken);
  private stateService = inject(StateService);
  private errorService = inject(ErrorService);

  /**
   * Toggle the active status of a single concept in a CodeSystem
   * @param codeSystemId - The ID of the CodeSystem
   * @param conceptCode - The code of the concept to toggle
   * @param newActiveStatus - The new active status (true/false)
   * @returns Observable<CodeSystem> - The updated CodeSystem resource
   */
  toggleConceptActive(
    codeSystemId: string,
    conceptCode: string,
    newActiveStatus: boolean
  ): Observable<CodeSystem> {
    console.log(`🔄 Toggling concept ${conceptCode} to active=${newActiveStatus} in CodeSystem/${codeSystemId}`);

    // Step 1: Fetch the current CodeSystem
    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        // Step 2: Find and update the concept
        if (!codeSystem.concept) {
          throw new Error('CodeSystem has no concepts');
        }

        const conceptIndex = codeSystem.concept.findIndex(c => c.code === conceptCode);
        if (conceptIndex === -1) {
          throw new Error(`Concept with code "${conceptCode}" not found in CodeSystem`);
        }

        // Step 3: Update the concept's active property
        const concept = codeSystem.concept[conceptIndex];
        if (!concept.property) {
          concept.property = [];
        }

        const activePropertyIndex = concept.property.findIndex(p => p.code === 'active');
        if (activePropertyIndex !== -1) {
          // Update existing active property
          concept.property[activePropertyIndex].valueBoolean = newActiveStatus;
        } else {
          // Add new active property
          concept.property.push({
            code: 'active',
            valueBoolean: newActiveStatus
          });
        }

        console.log(`✅ Updated concept ${conceptCode} active status to ${newActiveStatus}`);
        return codeSystem;
      }),
      // Step 4: Update the CodeSystem on the server
      tap((updatedCodeSystem: CodeSystem) => {
        this.updateCodeSystem(updatedCodeSystem).subscribe({
          next: (response) => {
            console.log(`✅ CodeSystem/${codeSystemId} updated successfully`);
            this.stateService.persistOrgWideResource(response, 'saved');
          },
          error: (err) => {
            console.error(`❌ Failed to update CodeSystem/${codeSystemId}:`, err);
            this.errorService.openandCloseError('Failed to update concept status');
          }
        });
      })
    );
  }

  /**
   * Batch toggle active status for multiple concepts in a CodeSystem
   * @param codeSystemId - The ID of the CodeSystem
   * @param conceptUpdates - Array of {conceptCode, newActiveStatus}
   * @returns Observable<CodeSystem> - The updated CodeSystem resource
   */
  batchToggleConceptsActive(
    codeSystemId: string,
    conceptUpdates: Array<{ conceptCode: string; newActiveStatus: boolean }>
  ): Observable<CodeSystem> {
    console.log(`🔄 Batch toggling ${conceptUpdates.length} concepts in CodeSystem/${codeSystemId}`);

    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          throw new Error('CodeSystem has no concepts');
        }

        // Update all specified concepts
        conceptUpdates.forEach(({ conceptCode, newActiveStatus }) => {
          const conceptIndex = codeSystem.concept!.findIndex(c => c.code === conceptCode);
          if (conceptIndex === -1) {
            console.warn(`⚠️ Concept with code "${conceptCode}" not found, skipping`);
            return;
          }

          const concept = codeSystem.concept![conceptIndex];
          if (!concept.property) {
            concept.property = [];
          }

          const activePropertyIndex = concept.property.findIndex(p => p.code === 'active');
          if (activePropertyIndex !== -1) {
            concept.property[activePropertyIndex].valueBoolean = newActiveStatus;
          } else {
            concept.property.push({
              code: 'active',
              valueBoolean: newActiveStatus
            });
          }

          console.log(`✅ Updated concept ${conceptCode} active status to ${newActiveStatus}`);
        });

        return codeSystem;
      }),
      tap((updatedCodeSystem: CodeSystem) => {
        this.updateCodeSystem(updatedCodeSystem).subscribe({
          next: (response) => {
            console.log(`✅ CodeSystem/${codeSystemId} batch updated successfully`);
            this.stateService.persistOrgWideResource(response, 'saved');
          },
          error: (err) => {
            console.error(`❌ Failed to batch update CodeSystem/${codeSystemId}:`, err);
            this.errorService.openandCloseError('Failed to update concept statuses');
          }
        });
      })
    );
  }

  /**
   * Deactivate all concepts in a category
   * @param codeSystemId - The ID of the CodeSystem
   * @param category - The category value to filter concepts
   * @returns Observable<CodeSystem> - The updated CodeSystem resource
   */
  deactivateConceptsByCategory(
    codeSystemId: string,
    category: string
  ): Observable<CodeSystem> {
    console.log(`🔄 Deactivating all concepts in category "${category}" in CodeSystem/${codeSystemId}`);

    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          throw new Error('CodeSystem has no concepts');
        }

        // Find all concepts in the specified category
        const conceptsToDeactivate = codeSystem.concept.filter(concept => {
          const categoryProperty = concept.property?.find(p => p.code === 'category');
          return categoryProperty?.valueString === category;
        });

        console.log(`📋 Found ${conceptsToDeactivate.length} concepts in category "${category}"`);

        // Deactivate each concept
        conceptsToDeactivate.forEach(concept => {
          if (!concept.property) {
            concept.property = [];
          }

          const activePropertyIndex = concept.property.findIndex(p => p.code === 'active');
          if (activePropertyIndex !== -1) {
            concept.property[activePropertyIndex].valueBoolean = false;
          } else {
            concept.property.push({
              code: 'active',
              valueBoolean: false
            });
          }

          console.log(`✅ Deactivated concept ${concept.code} in category "${category}"`);
        });

        return codeSystem;
      }),
      tap((updatedCodeSystem: CodeSystem) => {
        this.updateCodeSystem(updatedCodeSystem).subscribe({
          next: (response) => {
            console.log(`✅ CodeSystem/${codeSystemId} updated - deactivated category "${category}"`);
            this.stateService.persistOrgWideResource(response, 'saved');
          },
          error: (err) => {
            console.error(`❌ Failed to deactivate category "${category}":`, err);
            this.errorService.openandCloseError(`Failed to deactivate concepts in category "${category}"`);
          }
        });
      })
    );
  }

  /**
   * Activate all concepts in a category
   * @param codeSystemId - The ID of the CodeSystem
   * @param category - The category value to filter concepts
   * @returns Observable<CodeSystem> - The updated CodeSystem resource
   */
  activateConceptsByCategory(
    codeSystemId: string,
    category: string
  ): Observable<CodeSystem> {
    console.log(`🔄 Activating all concepts in category "${category}" in CodeSystem/${codeSystemId}`);

    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          throw new Error('CodeSystem has no concepts');
        }

        const conceptsToActivate = codeSystem.concept.filter(concept => {
          const categoryProperty = concept.property?.find(p => p.code === 'category');
          return categoryProperty?.valueString === category;
        });

        console.log(`📋 Found ${conceptsToActivate.length} concepts in category "${category}"`);

        conceptsToActivate.forEach(concept => {
          if (!concept.property) {
            concept.property = [];
          }

          const activePropertyIndex = concept.property.findIndex(p => p.code === 'active');
          if (activePropertyIndex !== -1) {
            concept.property[activePropertyIndex].valueBoolean = true;
          } else {
            concept.property.push({
              code: 'active',
              valueBoolean: true
            });
          }

          console.log(`✅ Activated concept ${concept.code} in category "${category}"`);
        });

        return codeSystem;
      }),
      tap((updatedCodeSystem: CodeSystem) => {
        this.updateCodeSystem(updatedCodeSystem).subscribe({
          next: (response) => {
            console.log(`✅ CodeSystem/${codeSystemId} updated - activated category "${category}"`);
            this.stateService.persistOrgWideResource(response, 'saved');
          },
          error: (err) => {
            console.error(`❌ Failed to activate category "${category}":`, err);
            this.errorService.openandCloseError(`Failed to activate concepts in category "${category}"`);
          }
        });
      })
    );
  }

  /**
   * Get all active concepts from a CodeSystem
   * @param codeSystemId - The ID of the CodeSystem
   * @returns Observable<Array> - Array of active concept codes
   */
  getActiveConcepts(codeSystemId: string): Observable<string[]> {
    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          return [];
        }

        return codeSystem.concept
          .filter(concept => {
            const activeProperty = concept.property?.find(p => p.code === 'active');
            return activeProperty?.valueBoolean !== false; // Default to true if not specified
          })
          .map(concept => concept.code || '')
          .filter(Boolean);
      }),
      catchError((err) => {
        console.error('❌ Failed to get active concepts:', err);
        return of([]);
      })
    );
  }

  /**
   * Get all inactive concepts from a CodeSystem
   * @param codeSystemId - The ID of the CodeSystem
   * @returns Observable<Array> - Array of inactive concept codes
   */
  getInactiveConcepts(codeSystemId: string): Observable<string[]> {
    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          return [];
        }

        return codeSystem.concept
          .filter(concept => {
            const activeProperty = concept.property?.find(p => p.code === 'active');
            return activeProperty?.valueBoolean === false;
          })
          .map(concept => concept.code || '')
          .filter(Boolean);
      }),
      catchError((err) => {
        console.error('❌ Failed to get inactive concepts:', err);
        return of([]);
      })
    );
  }

  /**
   * Update a CodeSystem resource on the FHIR server
   * Uses PUT operation with proper ID handling
   * @param codeSystem - The updated CodeSystem resource
   * @returns Observable<CodeSystem> - The server response
   */
  private updateCodeSystem(codeSystem: CodeSystem): Observable<CodeSystem> {
    if (!codeSystem.id) {
      throw new Error('CodeSystem must have an ID for update operation');
    }

    console.log(`🔄 Updating CodeSystem/${codeSystem.id} on server...`);

    return this.http.put<CodeSystem>(
      `${this.backendUrl}/CodeSystem/${codeSystem.id}`,
      codeSystem
    ).pipe(
      tap((response) => {
        console.log(`✅ CodeSystem/${codeSystem.id} updated successfully on server`);
      }),
      catchError((err) => {
        console.error(`❌ Failed to update CodeSystem/${codeSystem.id}:`, err);
        throw err;
      })
    );
  }

  /**
   * Regenerate ValueSets after concept active status changes
   * This ensures ValueSets reflect the current active/inactive concept states
   * @param codeSystemUrl - The URL of the CodeSystem
   * @returns Observable<boolean> - Success status
   */
  regenerateValueSets(codeSystemUrl: string): Observable<boolean> {
    console.log(`🔄 Regenerating ValueSets for CodeSystem: ${codeSystemUrl}`);

    // Step 1: Fetch the CodeSystem to get updated concepts
    return this.http.get<Bundle<CodeSystem>>(
      `${this.backendUrl}/CodeSystem?url=${encodeURIComponent(codeSystemUrl)}`
    ).pipe(
      map((bundle: Bundle<CodeSystem>) => {
        if (!bundle.entry || bundle.entry.length === 0) {
          throw new Error('CodeSystem not found');
        }
        return bundle.entry[0].resource as CodeSystem;
      }),
      // Step 2: Generate new ValueSets based on current concept states
      map((codeSystem: CodeSystem) => {
        const concepts = codeSystem.concept || [];
        const activeConcepts = concepts.filter(c => {
          const activeProp = c.property?.find(p => p.code === 'active');
          return activeProp?.valueBoolean !== false;
        });

        // Extract unique categories
        const categories = new Set<string>();
        concepts.forEach(c => {
          const categoryProp = c.property?.find(p => p.code === 'category');
          if (categoryProp?.valueString) {
            categories.add(categoryProp.valueString);
          }
        });

        return { codeSystem, activeConcepts, categories };
      }),
      // Step 3: Fetch existing ValueSets to update
      tap(({ codeSystem, activeConcepts, categories }) => {
        const baseValueSetUrl = codeSystemUrl.replace('/CodeSystem/', '/ValueSet/');
        const valueSetUrls = [
          ...Array.from(categories).map(cat => `${baseValueSetUrl}${cat.replace(/\s+/g, '')}`),
          `${baseValueSetUrl}Active`,
          `${baseValueSetUrl}All`
        ];

        // Fetch and update each ValueSet
        const updateObservables = valueSetUrls.map(vsUrl =>
          this.http.get<Bundle<ValueSet>>(
            `${this.backendUrl}/ValueSet?url=${encodeURIComponent(vsUrl)}`
          ).pipe(
            map((bundle: Bundle<ValueSet>) => {
              if (!bundle.entry || bundle.entry.length === 0) {
                console.warn(`⚠️ ValueSet not found: ${vsUrl}`);
                return null;
              }
              return bundle.entry[0].resource as ValueSet;
            }),
            catchError(() => of(null))
          )
        );

        forkJoin(updateObservables).subscribe((valueSets) => {
          const existingValueSets = valueSets.filter(Boolean) as ValueSet[];
          console.log(`📦 Found ${existingValueSets.length} existing ValueSets to update`);

          // Update each ValueSet (no changes to compose, just touch to trigger re-expansion)
          existingValueSets.forEach(vs => {
            if (vs.id) {
              this.http.put<ValueSet>(
                `${this.backendUrl}/ValueSet/${vs.id}`,
                vs
              ).subscribe({
                next: (updated) => {
                  console.log(`✅ Updated ValueSet/${vs.id}`);
                  this.stateService.persistOrgWideResource(updated, 'saved');
                },
                error: (err) => {
                  console.error(`❌ Failed to update ValueSet/${vs.id}:`, err);
                }
              });
            }
          });
        });
      }),
      map(() => true),
      catchError((err) => {
        console.error('❌ Failed to regenerate ValueSets:', err);
        this.errorService.openandCloseError('Failed to regenerate ValueSets');
        return of(false);
      })
    );
  }

  /**
   * Validate concept modifications before submission
   * Checks for duplicate codes, empty values, etc.
   * @param codeSystem - The CodeSystem to validate
   * @returns {valid: boolean, errors: string[]}
   */
  validateConceptModifications(codeSystem: CodeSystem): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!codeSystem.concept || codeSystem.concept.length === 0) {
      errors.push('CodeSystem must have at least one concept');
    }

    // Check for duplicate codes
    const codes = new Set<string>();
    codeSystem.concept?.forEach((concept, index) => {
      if (!concept.code) {
        errors.push(`Concept at index ${index} is missing a code`);
        return;
      }

      if (codes.has(concept.code)) {
        errors.push(`Duplicate concept code found: ${concept.code}`);
      }
      codes.add(concept.code);

      if (!concept.display) {
        errors.push(`Concept ${concept.code} is missing a display value`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get concept statistics (active/inactive counts by category)
   * @param codeSystemId - The ID of the CodeSystem
   * @returns Observable<Object> - Statistics object
   */
  getConceptStatistics(codeSystemId: string): Observable<any> {
    return this.http.get<CodeSystem>(`${this.backendUrl}/CodeSystem/${codeSystemId}`).pipe(
      map((codeSystem: CodeSystem) => {
        if (!codeSystem.concept) {
          return { total: 0, active: 0, inactive: 0, byCategory: {} };
        }

        const stats: any = {
          total: codeSystem.concept.length,
          active: 0,
          inactive: 0,
          byCategory: {}
        };

        codeSystem.concept.forEach(concept => {
          const activeProp = concept.property?.find(p => p.code === 'active');
          const isActive = activeProp?.valueBoolean !== false;

          if (isActive) {
            stats.active++;
          } else {
            stats.inactive++;
          }

          const categoryProp = concept.property?.find(p => p.code === 'category');
          const category = categoryProp?.valueString || 'Uncategorized';

          if (!stats.byCategory[category]) {
            stats.byCategory[category] = { total: 0, active: 0, inactive: 0 };
          }

          stats.byCategory[category].total++;
          if (isActive) {
            stats.byCategory[category].active++;
          } else {
            stats.byCategory[category].inactive++;
          }
        });

        return stats;
      }),
      catchError((err) => {
        console.error('❌ Failed to get concept statistics:', err);
        return of({ total: 0, active: 0, inactive: 0, byCategory: {} });
      })
    );
  }
}
