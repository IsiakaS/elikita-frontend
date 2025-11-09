import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheStorageService {
  cache: any = {}
  constructor() {

  }
}
