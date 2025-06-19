import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {

  constructor() { }
  http = inject(HttpClient);
  convertPatientUrlToDisplayName(url: string): string {

  }
}
