import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, catchError } from 'rxjs';
import { of } from 'rxjs';

export const patientsResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  
  // Use FHIR search parameters to filter at server level for better performance
  // active=true filters for active patients
  // deceased=false filters out deceased patients
  const fhirUrl = "https://elikita-server.daalitech.com/Patient?active=true&deceased=false";
  
  return http.get(fhirUrl).pipe(
    catchError((error) => {
      // If FHIR search parameters are not supported, fallback to basic URL
      console.warn('FHIR search parameters not supported, falling back to basic URL:', error);
      return http.get("https://elikita-server.daalitech.com/Patient").pipe(
        catchError((fallbackError) => {
          // If both requests fail, return empty array
          console.error('Both primary and fallback requests failed:', fallbackError);
          return of({ entry: [] }); // Return empty FHIR Bundle structure
        })
      );
    }),
    map((response: any) => {
      console.log('Server response:', response);
      
      // Handle null or undefined response
      if (!response) {
        console.log('Server returned null/undefined response');
        return [];
      }
      
      let patients: any[] = [];
      
      // Handle FHIR Bundle response - extract patient resources
      if (response.entry && Array.isArray(response.entry)) {
        if (response.entry.length === 0) {
          console.log('Server returned empty FHIR Bundle');
          return [];
        }
        patients = response.entry.map((entry: any) => entry.resource).filter(Boolean);
      } else if (Array.isArray(response)) {
        // If response is already an array of patients
        if (response.length === 0) {
          console.log('Server returned empty array');
          return [];
        }
        patients = response;
      } else if (response && typeof response === 'object') {
        // Single patient object
        patients = [response];
      } else {
        console.log('Server returned unexpected response format:', typeof response);
        return [];
      }
      
      // Additional client-side filtering as backup
      const filteredPatients = patients.filter((patient: any) => {
        if (!patient) return false;
        
        // Check if patient is active
        const isActive = patient.active === true;
        
        // Check if patient is not deceased
        const isNotDeceased = !patient.deceasedBoolean && !patient.deceasedDateTime;
        
        const shouldInclude = isActive && isNotDeceased;
        
        if (!shouldInclude) {
          console.log(`Filtering out patient ${patient.id}: active=${patient.active}, deceased=${patient.deceasedBoolean || patient.deceasedDateTime || 'none'}`);
        }
        
        return shouldInclude;
      });
      
      console.log(`Processed ${patients.length} total patients, ${filteredPatients.length} active patients`);
      return filteredPatients;
    })
  );
  
  // Fallback to local data if server is unavailable
  // return http.get("/sample_fhir_patients.json");
};
